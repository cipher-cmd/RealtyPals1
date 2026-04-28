import { Request, Response } from 'express';
import { discoverProperties, DiscoveryInput } from '../logic/discoveryEngine';
import { IntentState, mergeIntentState, isIntentComplete, getNextQuestion, getQuestionForField } from '../services/intentManager';
import { extractIntentFromMessage, generateNextQuestion, generateAdvisorResponse, answerGeneralQuery, IntentJSON, IntentResult } from '../services/aiService';
import { validatePropertyPrices } from '../logic/propertyValidationHelper';
import { formatBudget, normalizeDisplayText, parsePropertyOrdinal, formatPropertyReference, generateConfidenceExplanation } from '../utils/formatters';
import { fetchGooglePlaces, buildPlacesQuery } from '../services/googlePlacesService';
import { getMarketPulse, getWalkability, getNearbyAmenities, getStaticMapUrl, geocodeLocation, getAreaPhoto } from '../services/googleIntelligence';
import {
  loadOrCreateChatSession,
  saveChatSession,
  trackAnalytics,
  getDefaultSectorName,
  getSeededSectorNames,
  getCachedShortlist,
  getCachedAdvisorIntro,
  getCachedLastDetailedPropertyId,
  setShortlist,
  setAdvisorIntro,
  setLastDetailedPropertyId,
  setCachedPhase,
  setCachedIntent,
  clearUserCache,
  ChatPhase,
} from '../services/chatSessionService';
import prisma from '../lib/prisma';

function hashMessage(userId: string, message: string): string {
  return `${userId}:${message.trim().toLowerCase()}`;
}


// ─── handleAdvisorMode ────────────────────────────────────────────────────────

async function handleAdvisorMode(
  message: string,
  currentShortlist: any[],
  intent: IntentState,
  userId: string,
  res: Response
) {
  const messageLower = message.toLowerCase();

  // ── Detection flags ──
  const isAmenityQuery = /(amenit|ammenit|amenet|ammenet|amenity|amenities)/i.test(messageLower);
  const isFloorPlanQuery = /(floor\s*plan|floorplan)/i.test(messageLower);
  const isInteriorQuery = /(interior|inside\b)/i.test(messageLower) && !/(invest|intelligence)/i.test(messageLower);
  const isHighlightQuery = /(highlights?|features?|qualities)/i.test(messageLower) && !/(best|better|which)/i.test(messageLower);
  const isSectorIntelligenceQuery = /sector intelligence|intelligence engine|market comparison|market context|market intelligence/i.test(messageLower);
  const isSpecificDetailQuery = isFloorPlanQuery || isInteriorQuery || isAmenityQuery || isHighlightQuery;
  const isGeneralDetailQuery =
    /(details?\s+(of|for|about)|project\s+details|more\s+about|tell\s+me\s+about|show\s+me\s+(the\s+)?(details?|all)|apartment\s+detail|complete\s+(detail|overview)|overview\s+of)/i.test(messageLower);
  const isDetailQuery = isSpecificDetailQuery || isGeneralDetailQuery;
  const isPropertyReference =
    /(first|second|third|fourth|fifth|\d+(?:st|nd|rd|th))/i.test(messageLower) &&
    /(about|detail|show|tell|ameniti|floor|interior|feature)/i.test(messageLower);

  // Build common intent payload
  const baseIntent = {
    completenessScore: intent.completenessScore,
    property_type: intent.property_type,
    bhk: intent.bhk,
    budget: intent.budget,
    purpose: intent.purpose,
  };



  // ── Refinement commands ──
  const isRefinementCommand =
    messageLower.includes('show only') ||
    messageLower.includes('remove') ||
    messageLower.includes('increase budget') ||
    messageLower.includes('decrease budget') ||
    messageLower.includes('change budget') ||
    messageLower.includes('filter');

  // ── Sector Intelligence ──
  if (isSectorIntelligenceQuery) {
    const locationDesc = [intent.sector, intent.city].filter(Boolean).join(', ') || 'the requested area';
    return res.json({
      message: `Here is the localized market intelligence for ${locationDesc}. These figures are based on our proprietary transaction database.`,
      properties: [],
      showRecommendations: false,
      showSectorIntelligence: true,
      chatPhase: 'ADVISOR',
      next_expected_field: undefined,
      resolvedFields: intent.resolvedFields || {},
      intent: baseIntent,
    });
  }

  if (isRefinementCommand) {
    let extractedRefinement: any = {};
    try {
      extractedRefinement = await extractIntentFromMessage(message, intent);
    } catch {
      // Fall back to regex pattern matching below
    }

    let updatedIntentForRefinement = { ...intent };
    let shouldRerunDiscovery = false;

    // Budget changes
    if (extractedRefinement.budget_max !== undefined || extractedRefinement.budget_min !== undefined) {
      if (!updatedIntentForRefinement.budget) updatedIntentForRefinement.budget = { flexibility: 'unknown' };
      if (extractedRefinement.budget_max !== undefined) updatedIntentForRefinement.budget!.max = extractedRefinement.budget_max;
      if (extractedRefinement.budget_min !== undefined) updatedIntentForRefinement.budget!.min = extractedRefinement.budget_min;
      shouldRerunDiscovery = true;
    } else {
      const budgetMatch = messageLower.match(/(?:increase|change|set|update)\s+budget\s+to\s+(\d+(?:\.\d+)?)\s*(?:crore|cr|c|lakh|l)/i);
      if (budgetMatch) {
        const amount = parseFloat(budgetMatch[1]);
        const unit = /crore|cr/.test(messageLower) ? 'crore' : 'lakh';
        if (!updatedIntentForRefinement.budget) updatedIntentForRefinement.budget = { flexibility: 'unknown' };
        updatedIntentForRefinement.budget!.max = unit === 'crore' ? amount * 10000000 : amount * 100000;
        shouldRerunDiscovery = true;
      }
    }

    // Status filter changes
    if (extractedRefinement.ready_to_move === true || extractedRefinement.under_construction === false) {
      if (!updatedIntentForRefinement.preferences) updatedIntentForRefinement.preferences = {};
      if (extractedRefinement.ready_to_move === true) {
        updatedIntentForRefinement.preferences!.ready_to_move = true;
        updatedIntentForRefinement.preferences!.under_construction = false;
      }
      if (extractedRefinement.under_construction === false) {
        updatedIntentForRefinement.preferences!.under_construction = false;
      }
      shouldRerunDiscovery = true;
    } else {
      if (messageLower.includes('show only ready') || messageLower.includes('ready to move only')) {
        if (!updatedIntentForRefinement.preferences) updatedIntentForRefinement.preferences = {};
        updatedIntentForRefinement.preferences!.ready_to_move = true;
        updatedIntentForRefinement.preferences!.under_construction = false;
        shouldRerunDiscovery = true;
      }
      if (messageLower.includes('remove under construction') || messageLower.includes('no under construction')) {
        if (!updatedIntentForRefinement.preferences) updatedIntentForRefinement.preferences = {};
        updatedIntentForRefinement.preferences!.under_construction = false;
        shouldRerunDiscovery = true;
      }
    }

    if (shouldRerunDiscovery) {
      setCachedIntent(userId, updatedIntentForRefinement);
      const sectorName = updatedIntentForRefinement.sector ?? (await getDefaultSectorName());
      const discoveryInput: DiscoveryInput = {
        sector: sectorName,
        bhk: updatedIntentForRefinement.bhk,
        property_type: updatedIntentForRefinement.property_type ?? undefined,
      };
      if (updatedIntentForRefinement.budget?.min != null) discoveryInput.min_price = updatedIntentForRefinement.budget.min;
      if (updatedIntentForRefinement.budget?.max != null) discoveryInput.max_price = updatedIntentForRefinement.budget.max;
      if (
        updatedIntentForRefinement.preferences?.ready_to_move === true ||
        updatedIntentForRefinement.preferences?.under_construction === false ||
        updatedIntentForRefinement.timeline === 'immediate'
      ) {
        discoveryInput.status_filter = 'ready';
      }

      const discovered = await discoverProperties(discoveryInput, prisma);
      const propertiesWithValidation = await validatePropertyPrices(discovered, sectorName);
      setShortlist(userId, propertiesWithValidation);
      setAdvisorIntro(userId, false);
      await saveChatSession(userId, updatedIntentForRefinement, 'ADVISOR');

      let confirmationMessage = '';
      if (updatedIntentForRefinement.budget?.max) {
        confirmationMessage = `Budget updated to ${formatBudget(updatedIntentForRefinement.budget.max)}. `;
      } else if (updatedIntentForRefinement.preferences?.ready_to_move) {
        confirmationMessage = 'Filtered to ready-to-move properties. ';
      } else if (updatedIntentForRefinement.preferences?.under_construction === false) {
        confirmationMessage = 'Excluded under-construction properties. ';
      } else {
        confirmationMessage = 'Filters updated. ';
      }
      confirmationMessage += `Found ${propertiesWithValidation.length} ${propertiesWithValidation.length === 1 ? 'property' : 'properties'}.`;

      return res.json({
        message: confirmationMessage,
        properties: propertiesWithValidation,
        showRecommendations: true,
        chatPhase: 'ADVISOR',
        next_expected_field: undefined,
        resolvedFields: updatedIntentForRefinement.resolvedFields || {},
        intent: {
          completenessScore: updatedIntentForRefinement.completenessScore,
          property_type: updatedIntentForRefinement.property_type,
          bhk: updatedIntentForRefinement.bhk,
          budget: updatedIntentForRefinement.budget,
          purpose: updatedIntentForRefinement.purpose,
        },
      });
    }

    return res.json({
      message: 'I can help refine your list. Try something like: "increase budget to 2.2 crore" or "show only ready to move".',
      properties: [],
      showRecommendations: true,
      chatPhase: 'ADVISOR',
      next_expected_field: undefined,
      resolvedFields: intent.resolvedFields || {},
      intent: baseIntent,
    });
  }

  // ── Conversational / Gemini path ──
  const skipGeminiForDeterministic = isDetailQuery || isPropertyReference;
  let advisorResponse = '';

  if (!skipGeminiForDeterministic) {
    try {
      const aiResp = await generateAdvisorResponse(message, currentShortlist, []);
      const isGeneric = /I can help you with questions about the shortlisted properties|What would you like to know\?/i.test(aiResp);
      if (aiResp && aiResp.length > 10 && !isGeneric) {
        return res.json({
          message: normalizeDisplayText(aiResp),
          properties: [],
          showRecommendations: true,
          chatPhase: 'ADVISOR',
          next_expected_field: undefined,
          resolvedFields: intent.resolvedFields || {},
          intent: baseIntent,
        });
      }
    } catch {
      // Fall through to deterministic responses
    }
  }

  const detailHandlerFirst = isDetailQuery || isPropertyReference;

  // ── Risk questions ──
  if (!detailHandlerFirst && /(risk|high risk|why|safe|safest)/i.test(messageLower)) {
    const highRisk = currentShortlist.filter(p => p.validation?.risk_flag === 'HIGH');
    const lowRisk = currentShortlist.filter(p => p.validation?.risk_flag === 'LOW');
    if (messageLower.includes('safest')) {
      const safest = lowRisk[0] || currentShortlist.find(p => p.validation?.risk_flag === 'MEDIUM');
      advisorResponse = safest
        ? `${safest.project_name || safest.builder} (${formatPropertyReference(currentShortlist.indexOf(safest), currentShortlist.length)}) has ${safest.validation?.risk_flag || 'LOW'} risk pricing. ${formatBudget(safest.price)}, ${safest.bhk} BHK, ${safest.size_sqft} sqft.`
        : 'All properties have similar risk levels. Check individual property cards for details.';
    } else if (highRisk.length > 0) {
      advisorResponse = `${highRisk.length} ${highRisk.length === 1 ? 'property has' : 'properties have'} HIGH risk (priced above market range). `;
      if (lowRisk.length > 0) advisorResponse += `${lowRisk.length} ${lowRisk.length === 1 ? 'is' : 'are'} safer (within market range).`;
    } else {
      advisorResponse = `All ${currentShortlist.length} properties are within market range for this sector.`;
    }
  }
  // ── Property-specific text summary ──
  else if (!detailHandlerFirst && /(first|second|third|fourth|fifth|\d+(st|nd|rd|th)|tell me (?:more )?about|about the|details (?:of|for)|more (?:info|details) on|what is|how is)/i.test(messageLower)) {
    let index = parsePropertyOrdinal(messageLower);
    const nameMatch = messageLower.match(/(?:tell me (?:more )?about|about|details (?:of|for)|more info on|info on|what is|tell me|show|how is) (.+)/i);
    if (index < 0) {
      if (nameMatch) {
        const term = (nameMatch[1] || '').replace(/:$/, '').trim().toLowerCase();
        index = currentShortlist.findIndex(p =>
          p.project_name?.toLowerCase().includes(term) || p.builder?.toLowerCase().includes(term)
        );
      }
    }
    if (index >= 0 && index < currentShortlist.length) {
      const prop = currentShortlist[index];
      advisorResponse = `${prop.project_name || prop.builder} (${formatPropertyReference(index, currentShortlist.length)}): ${formatBudget(prop.price)}, ${prop.bhk} BHK, ${prop.size_sqft} sqft. `;
      if (prop.validation) {
        advisorResponse += `${prop.validation.risk_flag} risk. `;
        if (prop.validation.reason_codes?.length > 0) {
          advisorResponse += `Factors: ${prop.validation.reason_codes.slice(0, 2).join(', ').replace(/_/g, ' ')}.`;
        }
      }
    } else if (nameMatch) {
       // FALLBACK: If they asked about a specific project not in our database/shortlist, use general expert search
       const term = (nameMatch[1] || nameMatch[2] || '').trim();
       const intentJson: IntentResult = { 
         sector: intent.sector,
         city: intent.city,
         project_name: term 
       };
       const generalResponse = await answerGeneralQuery(message, intentJson, userId);
       return res.json({
         message: generalResponse.text,
         images: generalResponse.images,
         properties: [], showRecommendations: false, chatPhase: 'ADVISOR',
         next_expected_field: undefined, resolvedFields: intent.resolvedFields || {}, intent: baseIntent,
       });
    } else {
      advisorResponse = `I can only advise on the ${currentShortlist.length} properties shown above. Please refer to them by position (1st, 2nd, etc.) or name.`;
    }
  }
  // ── Comparison ──
  else if (!detailHandlerFirst && /(compare|difference|vs|versus)/i.test(messageLower)) {
    if (currentShortlist.length >= 2) {
      const [first, second] = currentShortlist;
      const diff = Math.abs(first.price - second.price);
      advisorResponse = `${first.project_name || first.builder} vs ${second.project_name || second.builder}: ${formatBudget(first.price)} vs ${formatBudget(second.price)}. Difference: ${formatBudget(diff)}. `;
      if (first.validation && second.validation) advisorResponse += `Risk: ${first.validation.risk_flag} vs ${second.validation.risk_flag}.`;
    } else {
      advisorResponse = 'Need at least 2 properties to compare. Use the Compare page for detailed analysis.';
    }
  }
  // ── Detail handler ──
  else if (isDetailQuery || isPropertyReference) {
    let targetProp: any = null;
    let targetIndex = -1;

    // 1. By project name
    for (let i = 0; i < currentShortlist.length; i++) {
      if (currentShortlist[i].project_name && messageLower.includes(currentShortlist[i].project_name.toLowerCase())) {
        targetProp = currentShortlist[i]; targetIndex = i; break;
      }
    }
    // 2. By builder name
    if (!targetProp) {
      for (let i = 0; i < currentShortlist.length; i++) {
        if (currentShortlist[i].builder && messageLower.includes(currentShortlist[i].builder.toLowerCase())) {
          targetProp = currentShortlist[i]; targetIndex = i; break;
        }
      }
    }
    // 3. By ordinal
    if (!targetProp) {
      targetIndex = parsePropertyOrdinal(messageLower);
      if (targetIndex >= 0 && targetIndex < currentShortlist.length) {
        targetProp = currentShortlist[targetIndex];
      }
    }
    // 4. Last detailed property (follow-up)
    if (!targetProp) {
      const lastId = getCachedLastDetailedPropertyId(userId);
      if (lastId) targetProp = currentShortlist.find((p: any) => p.id === lastId);
    }
    // 5. Fallback: first property
    if (!targetProp && currentShortlist.length > 0) {
      targetProp = currentShortlist[0];
    }

    if (targetProp) {
      setLastDetailedPropertyId(userId, targetProp.id);
      try {
        const allImages = (targetProp.images || []).map((img: any) => ({
          url: img.image_url, caption: img.caption || undefined, type: img.image_type,
        }));
        const highlights = targetProp.highlights || [];
        const amenities = targetProp.amenities || [];
        const propName = targetProp.project_name || targetProp.builder;

        if (isFloorPlanQuery && !isGeneralDetailQuery) {
          const imgs = allImages.filter((i: any) => i.type === 'floor_plan');
          return res.json({
            message: normalizeDisplayText(imgs.length > 0 ? `Here's the floor plan for ${propName}:` : `Floor plan for ${propName} is not available yet. Here are the available images:`),
            properties: [], showRecommendations: false, chatPhase: 'ADVISOR', next_expected_field: undefined,
            resolvedFields: intent.resolvedFields || {},
            images: imgs.length > 0 ? imgs : allImages.slice(0, 2),
            intent: baseIntent,
          });
        }
        if (isInteriorQuery && !isGeneralDetailQuery) {
          const imgs = allImages.filter((i: any) => i.type === 'interior' || i.type === 'view');
          return res.json({
            message: normalizeDisplayText(imgs.length > 0 ? `Here are the interior views of ${propName}:` : `Interior images for ${propName} aren't available yet. Here's what we have:`),
            properties: [], showRecommendations: false, chatPhase: 'ADVISOR', next_expected_field: undefined,
            resolvedFields: intent.resolvedFields || {},
            images: imgs.length > 0 ? imgs : allImages.slice(0, 2),
            intent: baseIntent,
          });
        }
        if (isAmenityQuery && !isGeneralDetailQuery) {
          const top = amenities.slice(0, 10).map((a: string) =>
            a.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          );
          let msg = `${propName} offers ${amenities.length} amenities including:`;
          return res.json({
            message: normalizeDisplayText(msg), properties: [], showRecommendations: false, chatPhase: 'ADVISOR',
            next_expected_field: undefined, resolvedFields: intent.resolvedFields || {}, intent: baseIntent,
            amenities: top, // Send parsed amenities back for frontend to render as cards
          });
        }
        if (isHighlightQuery && !isGeneralDetailQuery) {
          return res.json({
            message: normalizeDisplayText(highlights.length > 0 ? `Key highlights of ${propName}:` : `Highlights for ${propName} aren't available yet. It's a ${targetProp.bhk} BHK, ${targetProp.size_sqft} sqft property by ${targetProp.builder}.`),
            properties: [], showRecommendations: false, chatPhase: 'ADVISOR', next_expected_field: undefined,
            resolvedFields: intent.resolvedFields || {},
            highlights: highlights.length > 0 ? highlights : undefined,
            intent: baseIntent,
          });
        }
        // General detail view
        return res.json({
          message: normalizeDisplayText(`Here are the complete details for ${propName}:`),
          properties: [], showRecommendations: false, chatPhase: 'ADVISOR', next_expected_field: undefined,
          resolvedFields: intent.resolvedFields || {},
          propertyDetail: {
            id: targetProp.id, project_name: propName, bhk: targetProp.bhk, size_sqft: targetProp.size_sqft,
            price: targetProp.price, bathrooms: targetProp.bathrooms || undefined, balconies: targetProp.balconies || undefined,
            status: targetProp.status, builder: targetProp.builder, amenities, highlights, images: allImages,
          },
          intent: baseIntent,
        });
      } catch {
        advisorResponse = `${targetProp.project_name || targetProp.builder}: ${targetProp.bhk} BHK, ${targetProp.size_sqft} sqft, ${formatBudget(targetProp.price)}.`;
      }
    } else {
      // Fallback: If they asked for details on a project not in DB, use expert search
      const intentJson: IntentResult = { sector: intent.sector, city: intent.city };
      const generalResponse = await answerGeneralQuery(message, intentJson, userId);
      return res.json({
        message: generalResponse.text,
        images: generalResponse.images,
        properties: [], showRecommendations: false, chatPhase: 'ADVISOR',
        next_expected_field: undefined, resolvedFields: intent.resolvedFields || {}, intent: baseIntent,
      });
    }
  }
  // ── Builder-specific ──
  else if (/(godrej|samridhi|tata|dlf|adani|shapoorji|ats|ace|mahagun|prateek|eldeco|bhutani|builder)/i.test(messageLower)) {
    const match = messageLower.match(/(godrej|samridhi|tata|dlf|adani|shapoorji|ats|ace|mahagun|prateek|eldeco|bhutani)/i);
    if (match) {
      const name = normalizeDisplayText(match[1]);
      const builderProps = currentShortlist.filter(p =>
        p.builder.toLowerCase().includes(name.toLowerCase()) ||
        (p.project_name && p.project_name.toLowerCase().includes(name.toLowerCase()))
      );
      advisorResponse = builderProps.length > 0
        ? `${builderProps.length} ${name} ${builderProps.length === 1 ? 'property' : 'properties'}: ${builderProps.map((p: any) => `${p.project_name || p.builder} (${formatBudget(p.price)}, ${p.validation?.risk_flag || 'N/A'} risk)`).join(', ')}.`
        : `No ${name} properties in current shortlist.`;
    } else {
      advisorResponse = 'I can provide builder information for properties in your shortlist. Which builder are you interested in?';
    }
  }
  // ── Default (Use AI Advisor for everything else) ──
  else {
    try {
      advisorResponse = await generateAdvisorResponse(message, currentShortlist, intent, userId);
      const introShown = getCachedAdvisorIntro(userId);
      if (!introShown) {
        setAdvisorIntro(userId, true);
        await saveChatSession(userId, intent, 'ADVISOR');
      }
    } catch {
      advisorResponse = `I can help with the ${currentShortlist.length} properties. Ask about risks, prices, comparisons, or specific properties.`;
    }
  }

  return res.json({
    message: normalizeDisplayText(advisorResponse),
    properties: [],
    showRecommendations: true, // handleAdvisorMode is only called when we have a shortlist
    chatPhase: 'ADVISOR',
    next_expected_field: undefined,
    resolvedFields: intent.resolvedFields || {},
    intent: baseIntent,
  });
}

// ─── Main chat handler ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/chat
 * Thin controller: validates inputs, delegates to service layer, returns response.
 */
export async function handleChat(req: Request, res: Response) {
  try {
    const { message, quickReply } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'message must be a string' });
    }

    // Input length validation — prevents Gemini API abuse
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ error: 'Message is too long. Maximum 2000 characters.' });
    }

    // Empty message → return opening question or advisor prompt
    if (trimmedMessage.length === 0) {
      if (!userId) return res.status(400).json({ error: 'X-User-Id header is required' });
      const { intent, chatPhase } = await loadOrCreateChatSession(userId);
      if (chatPhase === 'DISCOVERY') {
        const questionResult = getNextQuestion(intent);
        const hint = questionResult.hint ? `\n\n${questionResult.hint}` : '';
        await trackAnalytics(userId, 'QUESTION_SHOWN', questionResult.field, 'DISCOVERY');
        return res.json({
          message: questionResult.question + hint, properties: [], showRecommendations: false,
          chatPhase: 'DISCOVERY', next_expected_field: questionResult.field,
          resolvedFields: intent.resolvedFields || {},
          intent: { completenessScore: intent.completenessScore || 0, property_type: intent.property_type, bhk: intent.bhk, budget: intent.budget, purpose: intent.purpose },
        });
      }
      return res.json({
        message: "Ask me anything about your shortlisted properties—prices, risks, or comparisons—or tell me how you'd like to refine the list.",
        properties: [], showRecommendations: false, chatPhase,
        next_expected_field: undefined, resolvedFields: intent.resolvedFields || {},
        intent: { completenessScore: intent.completenessScore || 0, property_type: intent.property_type, bhk: intent.bhk, budget: intent.budget, purpose: intent.purpose },
      });
    }

    if (!userId) return res.status(400).json({ error: 'X-User-Id header is required' });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[CHAT] Processing user message:', hashMessage(userId, message));
    }

    const { intent, chatPhase: loadedPhase } = await loadOrCreateChatSession(userId);
    let chatPhase: any = loadedPhase;
    const defaultSectorName = await getDefaultSectorName();

    let extractedIntent: any = {};
    
    // If the user clicked a preset button, bypass the AI intent extraction entirely for blazing fast response
    if (quickReply && quickReply.field) {
      if (quickReply.field === 'property_type') extractedIntent.property_type = quickReply.value;
      if (quickReply.field === 'bhk') extractedIntent.bhk = parseInt(quickReply.value);
      if (quickReply.field === 'budget') extractedIntent.budget_max = quickReply.value;
      if (quickReply.field === 'purpose') extractedIntent.purpose = quickReply.value === 'end use' ? 'end_use' : 'investment';
      if (quickReply.field === 'status') {
        if (quickReply.value === 'ready to move') extractedIntent.ready_to_move = true;
        if (quickReply.value === 'under construction') extractedIntent.under_construction = true;
      }
    } else {
      try {
        extractedIntent = await extractIntentFromMessage(message, intent);
      } catch {
        extractedIntent = {};
      }
    }

    if (extractedIntent.api_error) {
      // Just log the error and let it gracefully fall back to regex/deterministic methods
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CHAT] AI failed gracefully with error: ${extractedIntent.api_error}`);
      }
    }

    // Check if Gemini detected a strictly conversational query
    if (extractedIntent.conversational_reply && chatPhase === 'DISCOVERY') {
      return res.json({ 
        message: extractedIntent.conversational_reply, 
        properties: [], 
        showRecommendations: false, 
        chatPhase: 'DISCOVERY', 
        next_expected_field: undefined, 
        resolvedFields: intent.resolvedFields || {}, 
        intent: { completenessScore: intent.completenessScore || 0, property_type: intent.property_type, bhk: intent.bhk, budget: intent.budget, purpose: intent.purpose } 
      });
    }

    // Map extracted fields to intent updates
    const intentUpdates: Partial<IntentState> = {};
    if (extractedIntent.property_type === 'flat' || extractedIntent.property_type === 'plot') intentUpdates.property_type = extractedIntent.property_type;
    if (typeof extractedIntent.bhk === 'number') intentUpdates.bhk = extractedIntent.bhk;
    if (typeof extractedIntent.budget_min === 'number' || typeof extractedIntent.budget_max === 'number' || typeof extractedIntent.budget_flexibility === 'string' || typeof extractedIntent.budget_max === 'string') {
      intentUpdates.budget = { min: extractedIntent.budget_min, max: extractedIntent.budget_max, flexibility: extractedIntent.budget_flexibility || 'unknown' };
    }
    if (extractedIntent.purpose) intentUpdates.purpose = extractedIntent.purpose;
    if (extractedIntent.timeline) intentUpdates.timeline = extractedIntent.timeline;
    if (extractedIntent.sector) intentUpdates.sector = extractedIntent.sector;
    if (extractedIntent.city) intentUpdates.city = extractedIntent.city;
    const prefUpdates: IntentState['preferences'] = {};
    if (typeof extractedIntent.ready_to_move === 'boolean') prefUpdates.ready_to_move = extractedIntent.ready_to_move;
    if (typeof extractedIntent.under_construction === 'boolean') prefUpdates.under_construction = extractedIntent.under_construction;
    if (extractedIntent.builder_preference) prefUpdates.builder_preference = extractedIntent.builder_preference;
    if (extractedIntent.floor_preference) prefUpdates.floor_preference = extractedIntent.floor_preference;
    if (Object.keys(prefUpdates).length > 0) intentUpdates.preferences = { ...intent.preferences, ...prefUpdates };

    const hasQualificationDelta =
      intentUpdates.property_type !== undefined || intentUpdates.bhk !== undefined ||
      intentUpdates.budget !== undefined || intentUpdates.purpose !== undefined ||
      intentUpdates.sector !== undefined || intentUpdates.city !== undefined ||
      intentUpdates.timeline !== undefined || (intentUpdates.preferences !== undefined && Object.keys(intentUpdates.preferences).length > 0);

    const isExplicitDetailQuery =
      /(details?\s+(of|for|about)|more\s+about|tell\s+me\s+about|show\s+me\s+(the\s+)?(details?|floor|interior|inside|ameniti|highlight|feature|apartment)|floor\s*plan|floorplan|interior|inside\b|highlights?|features?|apartment\s+detail|amenit|intelligence|sector intelligence)/i.test(message) && !/sector \d+/i.test(message);

    // CRITICAL FIX: Always merge on top of the FULL existing intent first.
    const updatedIntent: IntentState = mergeIntentState(intent, intentUpdates);

    console.log(`[CHAT] User: ${userId} | Message: "${message}"`);
    console.log(`[CHAT] Extracted: ${JSON.stringify(extractedIntent)}`);
    console.log(`[CHAT] Active Sector: ${updatedIntent.sector} | Active Project: ${updatedIntent.project_name}`);

    // Advisor routing MUST run before is_general_query.
    // When chatPhase is ADVISOR and the shortlist is cached, the follow-up message belongs
    // to that session — regardless of whether the AI flagged is_general_query (which it does
    // when the follow-up message contains no explicit city/sector).
    const isAdvisor = (chatPhase as string) === 'ADVISOR';
    if ((isAdvisor || isExplicitDetailQuery) && (!hasQualificationDelta || isExplicitDetailQuery)) {
      const cachedShortlist = getCachedShortlist(userId);
      if (cachedShortlist.length > 0) {
        return handleAdvisorMode(message, cachedShortlist, updatedIntent, userId, res);
      }
      // Shortlist empty (cache miss after restart) — fall through to re-run discovery
    }

    // If the query is a broad general question (e.g., "Is Noida a good investment?"), route to answerGeneralQuery() IMMEDIATELY.
    if (extractedIntent.is_general_query) {
      const sectorNum = updatedIntent.sector
        ? parseInt(updatedIntent.sector.replace(/[^0-9]/g, ''), 10) || undefined
        : undefined;
      const intentJson: IntentResult = {
        bhk: updatedIntent.bhk,
        budget_max: updatedIntent.budget?.max,
        budget_min: updatedIntent.budget?.min,
        sector: updatedIntent.sector,
        city: updatedIntent.city,
        project_name: updatedIntent.project_name,
      };

      // Use the new multi-location capable general query handler
      const generalResult = await answerGeneralQuery(message, intentJson, userId);
      
      let finalPhase: ChatPhase = 'DISCOVERY';
      await saveChatSession(userId, updatedIntent, finalPhase);

      return res.json({
        message: (generalResult.text + (extractedIntent.conversational_reply ? `\n\n${extractedIntent.conversational_reply}` : '')).trim(),
        images: generalResult.images,
        properties: [],
        showRecommendations: false,
        chatPhase: finalPhase,
        next_expected_field: undefined,
        resolvedFields: updatedIntent.resolvedFields || {},
        intent: {
          completenessScore: updatedIntent.completenessScore,
          property_type: updatedIntent.property_type,
          bhk: updatedIntent.bhk,
          budget: updatedIntent.budget,
          purpose: updatedIntent.purpose,
        },
      });
    }

    // Track analytics for newly resolved fields
    const resolvedFields = updatedIntent.resolvedFields || {};
    const previousResolved = intent.resolvedFields || {};
    for (const [field, isResolved] of Object.entries(resolvedFields)) {
      if (isResolved && !previousResolved[field as keyof typeof previousResolved]) {
        await trackAnalytics(userId, 'ANSWER_RECEIVED', field, chatPhase);
      }
    }

    await saveChatSession(userId, updatedIntent, chatPhase);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[CHAT] Intent Updated:', updatedIntent);
    }

    let responseMessage = '';
    let properties: any[] = [];
    let showRecommendations = false;

    // UNIVERSAL RULE: Chat is for everyone, everywhere. 
    // We use Google Places for dynamic discovery and AI for everything else.
    const hasSearchIntent = !!(updatedIntent.sector || updatedIntent.city || updatedIntent.bhk || updatedIntent.property_type);
    
    if (hasSearchIntent) {
      const sectorName = updatedIntent.sector || undefined;
      const city = updatedIntent.city || undefined;

      let resultsArray: any[] = [];
      const searchQuery = buildPlacesQuery({
        bhk: updatedIntent.bhk,
        propertyType: updatedIntent.property_type as any,
        sector: sectorName,
        city: city,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[CHAT] Universal Discovery Query: "${searchQuery}"`);
      }

      const googleResults = await fetchGooglePlaces(searchQuery);
      resultsArray = Array.isArray(googleResults) ? googleResults : [];

      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      const buildPhotoUrl = (ref: string | null): string | null =>
        ref && placesKey
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${placesKey}`
          : null;

      properties = resultsArray.map((p: any, idx: number) => ({
        id: `google-place-${idx}`,
        project_name: p.projectName,
        builder: p.projectName.split(' ')[0] || 'Developer',
        address: p.address,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        bhk: updatedIntent.bhk || undefined,
        price: updatedIntent.budget?.max || undefined,
        image_url: buildPhotoUrl(p.photoReference),
        validation: { risk_flag: 'LIVE_DATA', reason_codes: [] }
      }));

      if (properties.length > 0) {
        showRecommendations = true; 
        
        let marketPulse = "";
        let walkability = "";
        let localVibe = "";
        
        // Intelligence gathering for the primary location
        const locationToInquire = sectorName || city;
        if (locationToInquire) {
          const coords = await geocodeLocation(locationToInquire, city);
          let lat: number | null = coords?.lat ?? resultsArray[0]?.lat ?? null;
          let lng: number | null = coords?.lng ?? resultsArray[0]?.lng ?? null;

          if (lat && lng) {
            const [pulse, walk, amenities, heroPhoto] = await Promise.all([
              getMarketPulse(locationToInquire),
              getWalkability(lat, lng, city),
              getNearbyAmenities(lat, lng),
              getAreaPhoto(locationToInquire, city)
            ].map(p => p.catch(() => ""))); // Graceful failure for intel
            
            marketPulse = typeof pulse === 'string' ? pulse : "";
            walkability = typeof walk === 'string' ? walk : "";
            localVibe = typeof amenities === 'string' ? amenities : "";

            // Apply visuals
            properties = properties.map((p, idx) => ({
              ...p,
              image_url: p.image_url || (idx === 0 && heroPhoto ? heroPhoto : null) || getStaticMapUrl(lat!, lng!)
            }));
          }
        }
        
        (updatedIntent as any).marketPulse = marketPulse;
        (updatedIntent as any).walkability = walkability;
        (updatedIntent as any).localVibe = localVibe;
        setShortlist(userId, properties);
        chatPhase = 'ADVISOR';
        await saveChatSession(userId, updatedIntent, chatPhase);

        try {
          responseMessage = await generateAdvisorResponse(message, properties, updatedIntent, userId);
        } catch {
          responseMessage = `I found ${properties.length} options matching your criteria. How do these look to you?`;
        }
      } else {
        // No properties found via Google, use AI to explain or pivot
        const genRes = await answerGeneralQuery(message, updatedIntent, userId);
        responseMessage = genRes.text;
      }
    } else {
      // General question OR Greeting
      const genRes = await answerGeneralQuery(message, updatedIntent, userId);
      responseMessage = genRes.text;
    }

    let next_expected_field: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | 'sector' | undefined;
    const nextQ = getNextQuestion(updatedIntent);
    const hasQuestionMark = responseMessage.trim().endsWith('?');
    
    // Only append the next question if the AI didn't already ask one and if we're in discovery
    if (chatPhase === 'DISCOVERY' && !hasQuestionMark && nextQ && nextQ.question) {
      responseMessage = `${responseMessage}\n\n${nextQ.question}`;
      next_expected_field = nextQ.field;
    } else if (nextQ) {
      next_expected_field = nextQ.field;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[CHAT] sending to frontend', { messageLen: responseMessage?.length, showRecommendations, chatPhase, next_expected_field });
    }

    return res.json({
      message: responseMessage,
      properties: showRecommendations ? properties : [],
      showRecommendations,
      chatPhase,
      next_expected_field,
      resolvedFields: updatedIntent.resolvedFields || {},
      intent: {
        completenessScore: updatedIntent.completenessScore,
        property_type: updatedIntent.property_type,
        bhk: updatedIntent.bhk,
        budget: updatedIntent.budget,
        purpose: updatedIntent.purpose === 'unknown' ? undefined : updatedIntent.purpose,
      },
    });
  } catch (error: any) {
    console.error('[CHAT] Unhandled error:', error.message);
    return res.status(500).json({ error: true, message: 'Something went wrong. Please try again.' });
  }
}

// ─── GET /api/v1/chat/intent ────────────────────────────────────────────────

export async function getIntent(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'X-User-Id header is required' });
    const { intent } = await loadOrCreateChatSession(userId);
    res.json({ intent });
  } catch (error: any) {
    res.status(500).json({ error: true, message: 'Failed to get intent' });
  }
}

// ─── DELETE /api/v1/chat/intent ─────────────────────────────────────────────

export async function resetIntent(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'X-User-Id header is required' });

    const currentPhase = 'DISCOVERY';
    await trackAnalytics(userId, 'CHAT_RESET', undefined, currentPhase);

    // Clear cache and save session
    try {
      clearUserCache(userId);
      await saveChatSession(userId, { completenessScore: 0 }, currentPhase);
    } catch (err) {
      console.error('[CHAT] Failed to persist session:', err);
    }

    res.json({ message: 'Intent reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: 'Failed to reset intent' });
  }
}
