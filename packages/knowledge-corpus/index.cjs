const KNOWLEDGE_DOMAINS = {
  LAW: {
    id: "LAW",
    name: "Legal Knowledge",
    description: "Transportation law, contract law, regulatory compliance, and sovereign governance",
    categories: {
      TRANSPORTATION_LAW: {
        name: "Transportation Law",
        topics: [
          { id: "FMCSA", name: "Federal Motor Carrier Safety Administration", scope: "US trucking regulations, safety standards, hours of service" },
          { id: "DOT", name: "Department of Transportation", scope: "Federal transportation oversight, infrastructure, safety" },
          { id: "IATA", name: "International Air Transport Association", scope: "Air cargo regulations, dangerous goods, security" },
          { id: "IMO", name: "International Maritime Organization", scope: "Ocean shipping, container standards, port security" },
          { id: "CBP", name: "Customs and Border Protection", scope: "Import/export, duties, documentation, compliance" }
        ]
      },
      CONTRACT_LAW: {
        name: "Contract Law",
        topics: [
          { id: "BOL", name: "Bill of Lading", scope: "Carrier liability, shipper rights, documentation requirements" },
          { id: "CARMACK", name: "Carmack Amendment", scope: "Interstate carrier liability, cargo claims, damage resolution" },
          { id: "UCC", name: "Uniform Commercial Code", scope: "Commercial transactions, sales contracts, secured transactions" },
          { id: "INCOTERMS", name: "Incoterms 2020", scope: "International trade terms, risk transfer, cost allocation" },
          { id: "CISG", name: "UN Convention on Contracts", scope: "International sale of goods, formation, remedies" }
        ]
      },
      REGULATORY: {
        name: "Regulatory Compliance",
        topics: [
          { id: "ELD", name: "Electronic Logging Device", scope: "Hours of service tracking, FMCSA compliance, driver logs" },
          { id: "HAZMAT", name: "Hazardous Materials", scope: "DOT classification, handling, documentation, placarding" },
          { id: "CSA", name: "Compliance Safety Accountability", scope: "Safety ratings, BASIC scores, carrier selection" },
          { id: "CTPAT", name: "Customs-Trade Partnership", scope: "Supply chain security, trusted trader programs" },
          { id: "AEO", name: "Authorized Economic Operator", scope: "EU customs simplification, security standards" }
        ]
      },
      SOVEREIGN: {
        name: "Sovereign Governance",
        topics: [
          { id: "DYNASTY_CONST", name: "Dynasty Constitution", scope: "Sovereign principles, governance structure, IP ownership" },
          { id: "TREASURY_CONST", name: "Treasury Constitution", scope: "Financial governance, payout rules, transparency" },
          { id: "DRIVER_CHARTER", name: "Driver Charter", scope: "Citizenship rights, responsibilities, privileges" },
          { id: "CODEX_LAW", name: "Codex Law", scope: "Event taxonomy, audit requirements, chain integrity" },
          { id: "MINISTRY_LAW", name: "Ministry Framework", scope: "Organizational structure, roles, authorities" }
        ]
      }
    }
  },
  
  COMMERCE: {
    id: "COMMERCE",
    name: "Commercial Knowledge",
    description: "Trade finance, treasury operations, pricing strategies, and market dynamics",
    categories: {
      TRADE_FINANCE: {
        name: "Trade Finance",
        topics: [
          { id: "LC", name: "Letters of Credit", scope: "Documentary credits, bank guarantees, payment security" },
          { id: "FACTORING", name: "Freight Factoring", scope: "Invoice financing, quick pay, credit management" },
          { id: "ESCROW", name: "Escrow Services", scope: "Payment protection, milestone releases, dispute resolution" },
          { id: "INSURANCE", name: "Cargo Insurance", scope: "Coverage types, claims, valuation, exclusions" },
          { id: "SURETY", name: "Surety Bonds", scope: "Customs bonds, freight broker bonds, carrier bonds" }
        ]
      },
      TREASURY: {
        name: "Treasury Operations",
        topics: [
          { id: "CASH_FLOW", name: "Cash Flow Management", scope: "Receivables, payables, working capital optimization" },
          { id: "CREDIT_MGMT", name: "Credit Management", scope: "Driver advances, credit lines, risk assessment" },
          { id: "REWARDS", name: "Reward Systems", scope: "Loyalty points, badges, tier benefits, redemption" },
          { id: "ESCROW_OPS", name: "Escrow Operations", scope: "Deposit management, release triggers, reconciliation" },
          { id: "PAYOUT", name: "Payout Processing", scope: "Driver payments, partner settlements, fee distribution" }
        ]
      },
      PRICING: {
        name: "Pricing Strategies",
        topics: [
          { id: "SPOT_RATES", name: "Spot Market Rates", scope: "Real-time pricing, market dynamics, negotiation" },
          { id: "CONTRACT_RATES", name: "Contract Rates", scope: "Long-term agreements, volume commitments, rate locks" },
          { id: "ACCESSORIALS", name: "Accessorial Charges", scope: "Detention, layover, fuel surcharge, special services" },
          { id: "LANE_PRICING", name: "Lane Pricing", scope: "Origin-destination rates, seasonal adjustments, capacity" },
          { id: "DYNAMIC", name: "Dynamic Pricing", scope: "Demand-based pricing, surge pricing, optimization" }
        ]
      },
      MARKET: {
        name: "Market Dynamics",
        topics: [
          { id: "DEMAND", name: "Demand Signals", scope: "Freight indices, shipping patterns, economic indicators" },
          { id: "CAPACITY", name: "Capacity Analysis", scope: "Truck availability, driver shortage, fleet utilization" },
          { id: "COMPETITION", name: "Competitive Landscape", scope: "Market share, pricing trends, differentiation" },
          { id: "CYCLES", name: "Market Cycles", scope: "Seasonal patterns, economic cycles, disruption events" },
          { id: "TRENDS", name: "Industry Trends", scope: "Technology adoption, sustainability, regulation changes" }
        ]
      }
    }
  },
  
  LOGISTICS: {
    id: "LOGISTICS",
    name: "Logistics Knowledge",
    description: "Supply chain management, operations, technology, and optimization",
    categories: {
      SUPPLY_CHAIN: {
        name: "Supply Chain Management",
        topics: [
          { id: "PLANNING", name: "Demand Planning", scope: "Forecasting, inventory optimization, lead time" },
          { id: "SOURCING", name: "Strategic Sourcing", scope: "Carrier selection, RFP process, contract negotiation" },
          { id: "VISIBILITY", name: "Supply Chain Visibility", scope: "Tracking, transparency, real-time updates" },
          { id: "RISK", name: "Risk Management", scope: "Disruption planning, contingency, resilience" },
          { id: "SUSTAINABILITY", name: "Sustainable Logistics", scope: "Carbon footprint, green initiatives, compliance" }
        ]
      },
      OPERATIONS: {
        name: "Operations Management",
        topics: [
          { id: "DISPATCH", name: "Dispatch Operations", scope: "Load assignment, driver management, communication" },
          { id: "TRACKING", name: "Shipment Tracking", scope: "GPS, ELD integration, milestone updates, exceptions" },
          { id: "DOCUMENTATION", name: "Documentation", scope: "BOL, POD, customs docs, digital records" },
          { id: "EXCEPTION", name: "Exception Management", scope: "Delays, damages, claims, resolution workflows" },
          { id: "PERFORMANCE", name: "Performance Management", scope: "KPIs, scorecards, continuous improvement" }
        ]
      },
      TECHNOLOGY: {
        name: "Logistics Technology",
        topics: [
          { id: "TMS", name: "Transportation Management", scope: "Route optimization, load planning, carrier management" },
          { id: "WMS", name: "Warehouse Management", scope: "Inventory, picking, packing, cross-docking" },
          { id: "VISIBILITY_TECH", name: "Visibility Platforms", scope: "Real-time tracking, IoT, predictive analytics" },
          { id: "AI_ML", name: "AI/ML Applications", scope: "Predictive dispatch, demand forecasting, optimization" },
          { id: "BLOCKCHAIN", name: "Blockchain", scope: "Document verification, smart contracts, traceability" }
        ]
      },
      OPTIMIZATION: {
        name: "Optimization",
        topics: [
          { id: "ROUTING", name: "Route Optimization", scope: "Shortest path, multi-stop, time windows, constraints" },
          { id: "LOAD_OPT", name: "Load Optimization", scope: "Consolidation, cube utilization, weight distribution" },
          { id: "NETWORK", name: "Network Design", scope: "Hub locations, lane analysis, service levels" },
          { id: "FLEET", name: "Fleet Optimization", scope: "Asset utilization, maintenance, replacement" },
          { id: "COST", name: "Cost Optimization", scope: "Total cost of logistics, trade-offs, benchmarking" }
        ]
      }
    }
  },
  
  FREIGHT: {
    id: "FREIGHT",
    name: "Freight Knowledge",
    description: "Mode-specific expertise across ground, air, ocean, and courier operations",
    categories: {
      GROUND: {
        name: "Ground Freight",
        topics: [
          { id: "TL", name: "Truckload", scope: "Full truck, dedicated, team driving, expedited" },
          { id: "LTL", name: "Less Than Truckload", scope: "Consolidation, terminals, class ratings, accessorials" },
          { id: "INTERMODAL", name: "Intermodal", scope: "Rail-truck, containers, drayage, efficiency" },
          { id: "SPECIALIZED", name: "Specialized", scope: "Heavy haul, oversized, flatbed, tanker" },
          { id: "LAST_MILE", name: "Last Mile", scope: "Final delivery, urban logistics, time windows" }
        ]
      },
      AIR: {
        name: "Air Cargo",
        topics: [
          { id: "COMMERCIAL", name: "Commercial Cargo", scope: "Belly cargo, capacity, scheduling, rates" },
          { id: "FREIGHTER", name: "Freighter Aircraft", scope: "Dedicated cargo, charter, heavy lift" },
          { id: "EXPRESS", name: "Express/Courier", scope: "Time-definite, overnight, premium service" },
          { id: "DANGEROUS", name: "Dangerous Goods", scope: "IATA DGR, classification, handling, documentation" },
          { id: "COLD_CHAIN", name: "Cold Chain", scope: "Temperature control, pharma, perishables" }
        ]
      },
      OCEAN: {
        name: "Ocean Freight",
        topics: [
          { id: "FCL", name: "Full Container Load", scope: "Container types, booking, documentation" },
          { id: "LCL", name: "Less Container Load", scope: "Consolidation, CFS, cargo compatibility" },
          { id: "BULK", name: "Bulk Shipping", scope: "Dry bulk, liquid bulk, tankers, terminals" },
          { id: "RORO", name: "Roll-on/Roll-off", scope: "Vehicles, heavy equipment, specialized ships" },
          { id: "PORT_OPS", name: "Port Operations", scope: "Terminal handling, customs, drayage, demurrage" }
        ]
      },
      COURIER: {
        name: "Courier & Express",
        topics: [
          { id: "SAME_DAY", name: "Same Day Delivery", scope: "On-demand, time-critical, direct drive" },
          { id: "NEXT_DAY", name: "Next Day Service", scope: "Ground express, air express, hub networks" },
          { id: "PARCEL", name: "Parcel Shipping", scope: "Small package, dimensional weight, zones" },
          { id: "WHITE_GLOVE", name: "White Glove", scope: "Installation, assembly, room of choice" },
          { id: "MEDICAL", name: "Medical Courier", scope: "Specimens, organs, time-sensitive medical" }
        ]
      }
    }
  }
};

const AI_GUIDANCE_RESPONSES = {
  LAW: {
    FMCSA: "FMCSA regulations require carriers to maintain valid MC numbers, meet insurance requirements ($750K-$5M depending on cargo), and comply with Hours of Service rules (11-hour driving limit, 14-hour on-duty limit). The Dynasty OS automatically validates carrier compliance status before dispatch.",
    CARMACK: "Under the Carmack Amendment, carriers are strictly liable for cargo loss or damage unless caused by Act of God, public enemy, shipper fault, public authority, or inherent product defect. Document all cargo conditions at pickup and delivery. Dynasty Codex maintains immutable records for claims protection.",
    HAZMAT: "Hazmat shipments require proper classification (9 classes), DOT placarding, driver certification (HazMat endorsement on CDL), and specialized documentation. The Compliance Engine validates hazmat requirements before accepting loads."
  },
  COMMERCE: {
    FACTORING: "Freight factoring provides immediate cash flow by selling invoices at 2-5% discount. Dynasty Treasury offers 40% driver advances at zero interest, repaid automatically from load settlements. This builds driver loyalty while maintaining healthy cash flow.",
    DYNAMIC: "Dynamic pricing adjusts rates based on real-time market conditions. The Live Intel system monitors DAT/Truckstop rates, fuel prices, and capacity signals to recommend optimal pricing. Dynasty loads can command premium rates through service quality differentiation."
  },
  LOGISTICS: {
    DISPATCH: "AI Dispatch uses multi-factor scoring: loyalty tier (25%), safety record (20%), equipment match (20%), proximity (15%), deadline feasibility (10%), lane history (10%). The system learns from outcomes to continuously improve matching accuracy.",
    VISIBILITY: "Dynasty provides end-to-end visibility through ELD integration, GPS tracking, and milestone updates. Every status change becomes a Codex event, creating immutable proof of performance. Customers receive real-time updates via API or portal access."
  },
  FREIGHT: {
    TL: "Truckload is most economical for shipments >10,000 lbs or filling 50%+ of truck capacity. Standard dry van dimensions: 53' length, 102\" width, 110\" height, 45,000 lbs capacity. Dynasty handles TL across all 4 regions with validated carrier network.",
    LCL: "LCL consolidation is cost-effective for smaller ocean shipments (<15 CBM). Dynasty partners with consolidators at major ports. Lead time adds 3-5 days for consolidation/deconsolidation. Full container breakpoints vary by lane but typically 12-15 CBM."
  }
};

function getDomains() {
  return Object.values(KNOWLEDGE_DOMAINS).map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    categoryCount: Object.keys(d.categories).length
  }));
}

function getDomain(domainId) {
  return KNOWLEDGE_DOMAINS[domainId] || null;
}

function getCategory(domainId, categoryId) {
  const domain = KNOWLEDGE_DOMAINS[domainId];
  if (!domain) return null;
  return domain.categories[categoryId] || null;
}

function getTopic(domainId, categoryId, topicId) {
  const category = getCategory(domainId, categoryId);
  if (!category) return null;
  return category.topics.find(t => t.id === topicId) || null;
}

function searchKnowledge(query) {
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const domain of Object.values(KNOWLEDGE_DOMAINS)) {
    for (const [categoryId, category] of Object.entries(domain.categories)) {
      for (const topic of category.topics) {
        const relevance = calculateRelevance(queryLower, topic);
        if (relevance > 0) {
          results.push({
            domain: domain.id,
            domainName: domain.name,
            category: categoryId,
            categoryName: category.name,
            topic: topic.id,
            topicName: topic.name,
            scope: topic.scope,
            relevance
          });
        }
      }
    }
  }
  
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

function calculateRelevance(query, topic) {
  let score = 0;
  const searchText = `${topic.id} ${topic.name} ${topic.scope}`.toLowerCase();
  
  const words = query.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (searchText.includes(word)) {
      score += 10;
      if (topic.name.toLowerCase().includes(word)) score += 5;
      if (topic.id.toLowerCase().includes(word)) score += 5;
    }
  }
  
  return score;
}

function getAIGuidance(domainId, topicId) {
  const domainResponses = AI_GUIDANCE_RESPONSES[domainId];
  if (!domainResponses) return null;
  return domainResponses[topicId] || null;
}

function processKnowledgeQuery(query) {
  const results = searchKnowledge(query);
  
  if (results.length === 0) {
    return {
      type: "no_match",
      message: "No specific knowledge found. Please refine your query or browse available domains.",
      domains: getDomains()
    };
  }
  
  const topResult = results[0];
  const guidance = getAIGuidance(topResult.domain, topResult.topic);
  
  return {
    type: "knowledge",
    primaryMatch: topResult,
    guidance: guidance || `Topic: ${topResult.topicName}. ${topResult.scope}`,
    relatedTopics: results.slice(1, 5),
    actionable: true
  };
}

function getKnowledgeStats() {
  let totalTopics = 0;
  let totalCategories = 0;
  
  for (const domain of Object.values(KNOWLEDGE_DOMAINS)) {
    const categories = Object.values(domain.categories);
    totalCategories += categories.length;
    for (const category of categories) {
      totalTopics += category.topics.length;
    }
  }
  
  return {
    domains: Object.keys(KNOWLEDGE_DOMAINS).length,
    categories: totalCategories,
    topics: totalTopics,
    guidanceEntries: Object.values(AI_GUIDANCE_RESPONSES).reduce(
      (sum, d) => sum + Object.keys(d).length, 0
    )
  };
}

module.exports = {
  KNOWLEDGE_DOMAINS,
  AI_GUIDANCE_RESPONSES,
  getDomains,
  getDomain,
  getCategory,
  getTopic,
  searchKnowledge,
  getAIGuidance,
  processKnowledgeQuery,
  getKnowledgeStats
};
