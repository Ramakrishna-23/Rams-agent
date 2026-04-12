// ── Types ────────────────────────────────────────────────────────────────────

export type FieldOfOrigin =
  | "Logic"
  | "Mathematics / Statistics"
  | "Psychology / Cognitive Science"
  | "Economics"
  | "Systems Thinking"
  | "Engineering / Finance"
  | "Philosophy"
  | "Evolutionary Biology"
  | "Physics";

export type DomainOfApplication =
  | "Investing / Finance"
  | "Business / Strategy"
  | "Product / Design"
  | "Career Decisions"
  | "Relationships"
  | "Health"
  | "Negotiation"
  | "Management / Leadership"
  | "General / Universal";

export type ConnectionType = "combines_with" | "contrasts_with" | "prerequisite_for";

export interface RealExample {
  type: "business" | "personal" | "historical";
  title: string;
  description: string;
}

export interface Scenario {
  prompt: string;
  question: string;
  insight: string;
  category: "business" | "personal" | "historical";
}

export interface ModelConnection {
  from: string;
  to: string;
  type: ConnectionType;
}

export interface RelatedModel {
  slug: string;
  type: ConnectionType;
}

export interface MentalModel {
  slug: string;
  name: string;
  tagline: string;
  author: string;
  era: string;
  sourceBook: string;
  field: FieldOfOrigin[];
  domain: DomainOfApplication[];
  theory: string;
  metaphor: string;
  realExamples: RealExample[];
  selfCheckQuestions: string[];
  relatedModels: RelatedModel[];
  scenarios: Scenario[];
  keyQuestion: string;
}

// ── Taxonomy ─────────────────────────────────────────────────────────────────

export const ALL_FIELDS: FieldOfOrigin[] = [
  "Logic",
  "Mathematics / Statistics",
  "Psychology / Cognitive Science",
  "Economics",
  "Systems Thinking",
  "Engineering / Finance",
  "Philosophy",
  "Evolutionary Biology",
  "Physics",
];

export const ALL_DOMAINS: DomainOfApplication[] = [
  "Investing / Finance",
  "Business / Strategy",
  "Product / Design",
  "Career Decisions",
  "Relationships",
  "Health",
  "Negotiation",
  "Management / Leadership",
  "General / Universal",
];

// ── The 10 Mental Models ─────────────────────────────────────────────────────

export const MENTAL_MODELS: MentalModel[] = [
  {
    slug: "inversion",
    name: "Inversion",
    tagline: "Flip the problem. Ask what guarantees failure — then avoid it.",
    author: "Carl Jacobi / Charlie Munger",
    era: "19th century / 20th century",
    sourceBook: "Poor Charlie's Almanack",
    field: ["Logic"],
    domain: ["General / Universal", "Business / Strategy", "Career Decisions"],
    theory:
      "Instead of asking how to succeed, ask what guarantees failure — then avoid it. Invert the problem. Most people only think forward. Inversion forces you to see failure modes your optimism is hiding.",
    metaphor:
      "Imagine planning a road trip by listing every route that leads to a dead end. Once you eliminate those, the correct path becomes obvious.",
    realExamples: [
      {
        type: "business",
        title: "Amazon's 'working backwards' process",
        description:
          "Bezos asks teams to write the press release before building. By imagining the end state and inverting — what would make this product fail? — they avoid building features nobody wants.",
      },
      {
        type: "personal",
        title: "Avoiding a bad marriage",
        description:
          "Instead of asking 'what makes a great relationship?', Munger advises: 'What would guarantee a miserable marriage?' Being unreliable, jealous, and resentful. Now avoid those.",
      },
      {
        type: "historical",
        title: "Jacobi's mathematical breakthroughs",
        description:
          "Carl Jacobi solved intractable math problems by inverting them — 'man muss immer umkehren' (invert, always invert). Problems that were impossible forwards became obvious backwards.",
      },
    ],
    selfCheckQuestions: [
      "What would guarantee this fails? Am I doing any of those things?",
      "If I wanted to destroy this company / relationship / plan, what would I do?",
      "What is the opposite of what I am currently assuming?",
      "What do most people get wrong about this, and am I making the same mistake?",
    ],
    relatedModels: [
      { slug: "second-order-thinking", type: "combines_with" },
      { slug: "first-principles", type: "combines_with" },
      { slug: "lollapalooza-effect", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "You are launching a new SaaS product next quarter. The team is excited and focused on feature development.",
        question:
          "Using inversion, what are the top 3 things that would guarantee this launch fails?",
        insight:
          "Common inversion reveals: shipping without talking to users, ignoring onboarding friction, and building for edge cases instead of the core use case. Inversions forces you to stress-test optimism.",
        category: "business",
      },
      {
        prompt:
          "You have been offered a promotion that requires relocating to a new city. The salary increase is significant.",
        question:
          "Invert: what would make this move a disaster you regret in 2 years?",
        insight:
          "Typical failure modes include: losing your support network, underestimating cost of living, and taking a role that amplifies your weaknesses rather than your strengths. The salary looks good until you price in what you lose.",
        category: "personal",
      },
      {
        prompt:
          "Kodak invented the digital camera in 1975 but buried it to protect film revenue.",
        question:
          "How could Kodak's leadership have used inversion to see the threat?",
        insight:
          "Inverting: 'What would destroy our film business?' immediately surfaces digital photography. The failure was not lack of innovation — they literally invented it — but refusing to invert their own success.",
        category: "historical",
      },
    ],
    keyQuestion: "What would guarantee failure here?",
  },
  {
    slug: "first-principles",
    name: "First Principles / Occam's Razor",
    tagline: "Strip away assumptions. Rebuild from verified facts.",
    author: "Aristotle / William of Ockham",
    era: "4th century BC / 14th century",
    sourceBook: "Metaphysics (Aristotle); Summa Logicae (Ockham)",
    field: ["Logic", "Philosophy"],
    domain: ["General / Universal", "Product / Design", "Business / Strategy"],
    theory:
      "Strip away assumptions. Rebuild reasoning from verified facts. The simplest explanation that fits all the facts is most likely correct. Borrowed beliefs that have never been verified are intellectual debt.",
    metaphor:
      "Think of inherited assumptions as a house built on someone else's foundation. First principles says: dig down to bedrock, verify it is solid, then build your own structure.",
    realExamples: [
      {
        type: "business",
        title: "SpaceX reusable rockets",
        description:
          "Everyone said rockets had to be expendable. Musk asked: what are rockets made of? Aluminum, titanium, carbon fibre. The raw material cost is ~2% of the rocket price. First principles showed reusability was an engineering problem, not a physics one.",
      },
      {
        type: "personal",
        title: "Career path assumptions",
        description:
          "Most people follow the prescribed career ladder: degree → entry-level → mid → senior. First principles asks: what skills does the end goal actually require? Often the prescribed path includes years of unnecessary steps.",
      },
      {
        type: "historical",
        title: "Copernicus and heliocentrism",
        description:
          "The geocentric model required increasingly complex epicycles. Copernicus applied Occam's razor: a simpler model with the sun at the center explained the same observations with far less complexity.",
      },
    ],
    selfCheckQuestions: [
      "What do I know for certain here, and what am I just assuming?",
      "If I had to rebuild this reasoning from scratch, what would survive?",
      "Is there a simpler explanation I am ignoring because it seems too obvious?",
      "Am I borrowing this belief from someone else, or have I actually verified it?",
    ],
    relatedModels: [
      { slug: "inversion", type: "combines_with" },
      { slug: "circle-of-competence", type: "prerequisite_for" },
      { slug: "probabilistic-thinking", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your startup is spending $50K/month on a tech stack because 'that is what companies at our stage use.'",
        question:
          "Apply first principles: what does the product actually need to run?",
        insight:
          "Many startups over-engineer infrastructure based on borrowed assumptions from larger companies. First principles often reveals you can run on a fraction of the cost by building for actual load, not imagined scale.",
        category: "business",
      },
      {
        prompt:
          "You believe you need an MBA to transition into product management.",
        question:
          "Break this down to first principles: what does a PM role actually require?",
        insight:
          "The core PM skills — user empathy, prioritisation, cross-functional communication — can be built without an MBA. The degree is a proxy signal, not a prerequisite. First principles separates the skill from the credential.",
        category: "personal",
      },
      {
        prompt:
          "In the 1800s, physicians believed 'bad air' (miasma) caused disease, leading to ineffective treatments.",
        question:
          "How did first principles thinking eventually overturn miasma theory?",
        insight:
          "John Snow traced cholera to contaminated water by following the data rather than the prevailing theory. He rebuilt from observable facts — who got sick and where — rather than inherited belief.",
        category: "historical",
      },
    ],
    keyQuestion: "What do we know for certain vs. what are we assuming?",
  },
  {
    slug: "circle-of-competence",
    name: "Circle of Competence",
    tagline: "Know what you know — and more importantly, what you don't.",
    author: "Warren Buffett / Charlie Munger",
    era: "20th century",
    sourceBook: "Berkshire Hathaway shareholder letters",
    field: ["Philosophy"],
    domain: ["Investing / Finance", "Career Decisions", "Business / Strategy"],
    theory:
      "Know what you know. The most dangerous ignorance is not knowing what you do not know. Operating outside your circle of competence while believing you are inside it is how catastrophic mistakes happen.",
    metaphor:
      "Your circle of competence is a spotlight. Inside the beam, you see clearly. Outside it, you are guessing in the dark — but the dangerous part is when you do not realise the light has ended.",
    realExamples: [
      {
        type: "business",
        title: "Buffett avoiding tech stocks in the 1990s",
        description:
          "Buffett was ridiculed for missing the dot-com boom. But he knew he did not understand tech well enough to pick winners. When the bubble burst, his discipline was vindicated.",
      },
      {
        type: "personal",
        title: "DIY home renovation gone wrong",
        description:
          "You watch a YouTube video and think you can rewire your kitchen. Electrical work is outside your circle of competence. The result: code violations, fire risk, and paying a professional twice as much to fix it.",
      },
      {
        type: "historical",
        title: "Long-Term Capital Management collapse (1998)",
        description:
          "Nobel Prize-winning economists built models that worked in theory but failed in practice. Their competence was in mathematics, not in market psychology during a panic. The circle broke.",
      },
    ],
    selfCheckQuestions: [
      "Do I actually understand this, or am I just comfortable with the vocabulary?",
      "Who knows this domain better than me, and what do they think?",
      "Am I inside or outside my circle of competence right now?",
      "What would I need to learn before this decision becomes one I am qualified to make?",
    ],
    relatedModels: [
      { slug: "first-principles", type: "prerequisite_for" },
      { slug: "probabilistic-thinking", type: "combines_with" },
      { slug: "incentives", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "A friend asks you to invest $50K in their cryptocurrency project. You have never traded crypto.",
        question:
          "Use circle of competence: should you invest? What would expand your circle enough?",
        insight:
          "The honest answer is almost always no. Expanding your circle requires months of study, not a weekend of research. The gap between 'I have heard of crypto' and 'I can evaluate a crypto project' is enormous.",
        category: "business",
      },
      {
        prompt:
          "You are asked to lead a cross-functional team in a domain you have never worked in.",
        question:
          "How do you lead effectively when the domain is outside your circle?",
        insight:
          "The best leaders in unfamiliar domains acknowledge gaps openly, hire for competence they lack, and focus on process and people — which is inside their circle — rather than pretending domain expertise.",
        category: "personal",
      },
      {
        prompt:
          "In 2008, major banks held mortgage-backed securities they did not fully understand.",
        question:
          "How did operating outside the circle of competence contribute to the financial crisis?",
        insight:
          "Bank executives trusted the models without understanding the underlying assumptions. The ratings agencies did the same. Everyone was outside their circle but inside their confidence. The system failed because no one said 'I do not understand this.'",
        category: "historical",
      },
    ],
    keyQuestion: "Are you inside or outside your circle of competence?",
  },
  {
    slug: "second-order-thinking",
    name: "Second-Order Thinking",
    tagline: "Ask not just 'what happens next' but 'and then what?'",
    author: "Howard Marks",
    era: "21st century",
    sourceBook: "The Most Important Thing",
    field: ["Systems Thinking"],
    domain: [
      "Investing / Finance",
      "Business / Strategy",
      "Product / Design",
      "Management / Leadership",
    ],
    theory:
      "Ask not just 'what happens next' but 'and then what?' Most people stop at the first-order effect. The interesting — and dangerous — consequences live in the second and third order.",
    metaphor:
      "First-order thinking is seeing the ripple where the stone hits the water. Second-order thinking is tracking what the ripple does when it hits the shore and bounces back.",
    realExamples: [
      {
        type: "business",
        title: "Uber's surge pricing",
        description:
          "First order: higher prices reduce demand. Second order: higher prices attract more drivers, which increases supply, which eventually reduces wait times and prices. The second-order effect was the real strategy.",
      },
      {
        type: "personal",
        title: "Saying yes to every social invitation",
        description:
          "First order: you are popular and connected. Second order: you are exhausted, your deep relationships suffer, and your work quality drops. The second-order cost of 'yes' is often higher than the first-order benefit.",
      },
      {
        type: "historical",
        title: "Prohibition in the United States (1920–1933)",
        description:
          "First order: alcohol consumption decreases. Second order: organised crime explodes, corruption spreads, public health worsens from unregulated alcohol. The second-order effects were catastrophically worse than the problem being solved.",
      },
    ],
    selfCheckQuestions: [
      "And then what? What happens after the obvious outcome plays out?",
      "Who benefits from this in a way that is not immediately obvious?",
      "What incentives does this create that might work against the intended goal?",
      "If everyone did this, what would the world look like in 10 years?",
    ],
    relatedModels: [
      { slug: "inversion", type: "combines_with" },
      { slug: "incentives", type: "combines_with" },
      { slug: "lollapalooza-effect", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your company decides to cut the engineering team by 20% to improve profitability this quarter.",
        question:
          "What are the second and third-order effects of this decision?",
        insight:
          "First order: costs drop. Second order: remaining engineers are overworked, morale drops, attrition increases. Third order: institutional knowledge leaves, product quality degrades, customers churn. The cost savings are a mirage.",
        category: "business",
      },
      {
        prompt:
          "You decide to take the highest-paying job offer, even though the work does not interest you.",
        question:
          "What are the second-order consequences of optimising purely for salary?",
        insight:
          "Second order: low engagement leads to poor performance, which leads to slower promotions and fewer opportunities. You may earn less over 10 years by choosing the higher starting salary.",
        category: "personal",
      },
      {
        prompt:
          "The Cobra Effect: colonial India offered bounties for dead cobras to reduce the snake population.",
        question:
          "What second-order effect made this policy backfire spectacularly?",
        insight:
          "People started breeding cobras for the bounty. When the government cancelled the program, breeders released their now-worthless snakes. The cobra population increased. The incentive created the exact opposite of the intended outcome.",
        category: "historical",
      },
    ],
    keyQuestion: "And then what? What are the second and third-order effects?",
  },
  {
    slug: "probabilistic-thinking",
    name: "Probabilistic Thinking",
    tagline: "Think in odds, not certainties. Assign probabilities, not verdicts.",
    author: "Annie Duke / Daniel Kahneman",
    era: "21st century",
    sourceBook: "Thinking in Bets (Duke); Thinking, Fast and Slow (Kahneman)",
    field: ["Mathematics / Statistics"],
    domain: [
      "Investing / Finance",
      "Business / Strategy",
      "Health",
      "General / Universal",
    ],
    theory:
      "Think in odds, not certainties. Assign rough probabilities instead of binary right/wrong. Bad outcomes do not mean bad decisions. Good outcomes do not mean good decisions. What matters is whether the odds were in your favour at the time.",
    metaphor:
      "Life is a poker game, not a chess game. In chess, the best move always wins. In poker, the best decision sometimes loses. Judge your process, not the single outcome.",
    realExamples: [
      {
        type: "business",
        title: "Amazon Web Services bet",
        description:
          "Bezos did not know AWS would succeed — he estimated the probability was high enough that the expected value justified the investment. The bet was right, but even if it had failed, the decision process was sound.",
      },
      {
        type: "personal",
        title: "Choosing to wear a seatbelt",
        description:
          "The probability of a car accident on any given drive is very low. But the expected value of wearing a seatbelt — tiny cost, massive benefit in the rare bad case — makes it the rational choice every time.",
      },
      {
        type: "historical",
        title: "The Cuban Missile Crisis (1962)",
        description:
          "Kennedy estimated the probability of nuclear war during the crisis at 'between one in three and even.' He chose de-escalation not because he was certain it would work, but because the alternative had catastrophic expected value.",
      },
    ],
    selfCheckQuestions: [
      "What is my actual confidence level here — 60%? 90%? Am I being honest?",
      "What are the three most likely scenarios, and how do I act across all of them?",
      "Am I treating a low-probability event as impossible, or a high-probability one as certain?",
      "Have I updated my beliefs in proportion to the new evidence?",
    ],
    relatedModels: [
      { slug: "margin-of-safety", type: "combines_with" },
      { slug: "availability-bias", type: "contrasts_with" },
      { slug: "circle-of-competence", type: "prerequisite_for" },
    ],
    scenarios: [
      {
        prompt:
          "Your startup has a 30% chance of getting Series A funding. You need to decide whether to continue bootstrapping or go all-in on the raise.",
        question:
          "How should probabilistic thinking guide this decision?",
        insight:
          "A 30% chance is not 'unlikely' — it is almost one in three. The question is not just 'will we get it?' but 'what is our plan across all scenarios?' Build a strategy that works at 30% and is great at 100%.",
        category: "business",
      },
      {
        prompt:
          "A medical test for a rare disease (1 in 10,000 prevalence) comes back positive. The test has a 1% false positive rate.",
        question:
          "What is the actual probability you have the disease?",
        insight:
          "Base rate neglect: with 1% false positives and 1 in 10,000 prevalence, a positive result is far more likely to be a false positive. The actual probability is roughly 1%. Most people assume it is 99%.",
        category: "personal",
      },
      {
        prompt:
          "In 2007, credit rating agencies gave AAA ratings to mortgage-backed securities, implying near-zero default probability.",
        question:
          "How did flawed probabilistic thinking contribute to the 2008 financial crisis?",
        insight:
          "The models treated housing prices as independent variables and assigned near-zero probability to a nationwide decline. They confused 'has not happened recently' with 'cannot happen.' The base rate was wrong.",
        category: "historical",
      },
    ],
    keyQuestion:
      "What is the actual probability distribution, not just the hoped-for outcome?",
  },
  {
    slug: "incentives",
    name: "Incentives",
    tagline: "Show me the incentive and I will show you the outcome.",
    author: "Charlie Munger",
    era: "20th century",
    sourceBook: "Poor Charlie's Almanack",
    field: ["Psychology / Cognitive Science", "Economics"],
    domain: [
      "Management / Leadership",
      "Negotiation",
      "Business / Strategy",
      "Relationships",
    ],
    theory:
      "Show me the incentive and I will show you the outcome. People respond to what they are rewarded for — not what they say they care about, and often not what they consciously intend. Systems produce the behaviour they incentivise.",
    metaphor:
      "Incentives are the invisible rails that guide human behaviour. You can preach values all day, but people will follow the rails — every time.",
    realExamples: [
      {
        type: "business",
        title: "Wells Fargo fake accounts scandal",
        description:
          "Employees were incentivised by account-opening targets. The incentive was clear: more accounts = more bonus. The result: millions of fake accounts. The system worked exactly as designed — the design was wrong.",
      },
      {
        type: "personal",
        title: "Why your doctor might over-test",
        description:
          "Fee-for-service medicine incentivises more tests and procedures. Your doctor may genuinely care about your health, but the financial incentive nudges toward doing more, not less.",
      },
      {
        type: "historical",
        title: "Soviet nail factory quotas",
        description:
          "When quotas were set by number of nails, factories produced millions of tiny useless nails. When quotas switched to weight, they produced a few enormous nails. The incentive shaped the output perfectly — just not usefully.",
        },
    ],
    selfCheckQuestions: [
      "What is this person actually being rewarded for — not what they say, but what the system pays them to do?",
      "Am I being influenced by my own financial or social interest without noticing it?",
      "What would a rational, self-interested actor do here, and is that what is happening?",
      "Whose incentives are misaligned with mine, and where will that cause conflict?",
    ],
    relatedModels: [
      { slug: "second-order-thinking", type: "combines_with" },
      { slug: "lollapalooza-effect", type: "combines_with" },
      { slug: "circle-of-competence", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your sales team consistently discounts products to close deals before quarter-end.",
        question:
          "What incentive is driving this behaviour, and how would you redesign it?",
        insight:
          "Quarterly revenue targets incentivise closing deals now, even at lower margins. The fix is not to scold salespeople — it is to change the incentive. Measure on margin, not just revenue. Behaviour follows incentives.",
        category: "business",
      },
      {
        prompt:
          "Your teenager promises to study more if you pay them per A grade.",
        question:
          "What incentives does this create beyond the obvious one?",
        insight:
          "You incentivise grade optimisation, not learning. They may pick easier classes, avoid challenging material, or learn to game the system rather than develop genuine curiosity. The incentive shapes what they optimise for.",
        category: "personal",
      },
      {
        prompt:
          "In the early 2000s, Enron's 'rank and yank' system fired the bottom 15% of performers annually.",
        question:
          "What incentives did this system create that contributed to Enron's collapse?",
        insight:
          "It incentivised short-term performance, backstabbing, hiding problems, and inflating results. Cooperation became irrational. The system selected for people who gamed metrics, not people who created value.",
        category: "historical",
      },
    ],
    keyQuestion:
      "What are the actual incentives at play, and whose are misaligned?",
  },
  {
    slug: "margin-of-safety",
    name: "Margin of Safety",
    tagline: "Build in a buffer. Never rely on best-case assumptions.",
    author: "Benjamin Graham",
    era: "20th century",
    sourceBook: "The Intelligent Investor",
    field: ["Engineering / Finance"],
    domain: [
      "Investing / Finance",
      "Business / Strategy",
      "Career Decisions",
      "Health",
    ],
    theory:
      "Build in a buffer. If you need a bridge to hold 10 tons, build it to hold 30. Never rely on best-case assumptions. The margin of safety is the gap between what you need to be right about and what you have to be right about.",
    metaphor:
      "A tightrope walker can be skilled, but the smart one strings a net below. Skill gets you across most of the time. The net saves you the one time skill is not enough.",
    realExamples: [
      {
        type: "business",
        title: "Berkshire Hathaway's cash reserves",
        description:
          "Buffett keeps billions in cash — not because he cannot invest it, but because the buffer lets him act when others are forced to sell. The margin of safety is not wasted capital; it is optionality.",
      },
      {
        type: "personal",
        title: "Emergency fund as financial margin",
        description:
          "Having 6 months of expenses saved is not pessimism — it is engineering a margin of safety into your life. When the unexpected hits (and it always does), the buffer turns a crisis into an inconvenience.",
      },
      {
        type: "historical",
        title: "The Titanic's insufficient lifeboats",
        description:
          "The Titanic was 'unsinkable' — so the designers skimped on lifeboats. Zero margin of safety. When the impossible happened, there was no buffer, and 1,500 people died.",
      },
    ],
    selfCheckQuestions: [
      "What is my worst realistic case, and can I survive it without catastrophic damage?",
      "Am I dependent on everything going right? What happens if one thing goes wrong?",
      "Have I left enough slack — time, money, energy — so that a mistake is not fatal?",
      "What assumption in this plan, if wrong, breaks the whole thing?",
    ],
    relatedModels: [
      { slug: "probabilistic-thinking", type: "combines_with" },
      { slug: "opportunity-cost", type: "contrasts_with" },
      { slug: "inversion", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your project timeline has zero slack — every milestone must hit its date for the launch to work.",
        question:
          "Where should you build in margin of safety, and how much?",
        insight:
          "Add 30-50% buffer to the critical path. The first delay cascades through every dependent task. Without margin, a single slip means the entire launch fails. With margin, you absorb the inevitable surprises.",
        category: "business",
      },
      {
        prompt:
          "You are buying a house at the very top of what the bank says you can afford.",
        question:
          "What does margin of safety say about this decision?",
        insight:
          "The bank's maximum is your ceiling, not your target. Margin of safety says buy well below your limit so that job loss, rate changes, or repairs do not become existential threats. Comfort at the top is fragility in disguise.",
        category: "personal",
      },
      {
        prompt:
          "The Challenger space shuttle launched despite engineer warnings about O-ring performance in cold weather.",
        question:
          "How did the absence of margin of safety contribute to the disaster?",
        insight:
          "The O-rings were rated for a temperature range. The launch temperature was below that range. The margin of safety was zero — actually negative. Management overruled engineering because 'it had worked before.' The absence of margin is not luck; it is a countdown.",
        category: "historical",
      },
    ],
    keyQuestion:
      "What is the worst realistic case, and is there enough buffer to survive it?",
  },
  {
    slug: "availability-bias",
    name: "Availability Bias",
    tagline: "Your brain confuses 'easy to recall' with 'likely to happen.'",
    author: "Daniel Kahneman / Amos Tversky",
    era: "20th century",
    sourceBook: "Thinking, Fast and Slow",
    field: ["Psychology / Cognitive Science"],
    domain: [
      "Investing / Finance",
      "Health",
      "General / Universal",
      "Business / Strategy",
    ],
    theory:
      "The mind gives too much weight to what is recent, vivid, or emotionally memorable. A plane crash you saw on the news makes flying feel more dangerous than driving, even though the statistics say the opposite. Availability is a proxy for frequency — but a bad one.",
    metaphor:
      "Your brain has a search engine, but it ranks by emotional intensity, not by truth. The most vivid result feels like the most common result — even when it is the rarest.",
    realExamples: [
      {
        type: "business",
        title: "Overreacting to a single customer complaint",
        description:
          "One angry tweet about your product feels like a crisis. But if 10,000 customers are happy and 1 is loud, the loud one is not representative — just available. Data beats anecdote.",
      },
      {
        type: "personal",
        title: "Fear of flying after a crash in the news",
        description:
          "After seeing a plane crash on TV, people drive instead of fly. Driving is statistically 100x more dangerous per mile. The vivid image of the crash overrides the dull statistics.",
      },
      {
        type: "historical",
        title: "Post-9/11 driving deaths",
        description:
          "After September 11, Americans avoided flying and drove instead. The resulting increase in car accidents killed an estimated 1,600 additional people in the year following the attacks — more than died in the towers.",
      },
    ],
    selfCheckQuestions: [
      "Is this fear or enthusiasm driven by a recent vivid event rather than actual probability?",
      "What relevant facts am I not thinking about because they are boring or hard to recall?",
      "Would I make the same decision if I heard about this outcome in a dry statistics table?",
      "Am I confusing the availability of examples with the frequency of the actual event?",
    ],
    relatedModels: [
      { slug: "probabilistic-thinking", type: "contrasts_with" },
      { slug: "lollapalooza-effect", type: "combines_with" },
      { slug: "incentives", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your competitor just had a major security breach that made headlines. Your board is now demanding an immediate, expensive security overhaul.",
        question:
          "Is the board's urgency driven by data or availability bias?",
        insight:
          "The breach is vivid and recent, which amplifies perceived risk. A proper response is a measured security audit based on your actual threat landscape — not a panic reaction driven by someone else's headlines.",
        category: "business",
      },
      {
        prompt:
          "After watching a documentary about a rare disease, you are convinced you have the symptoms.",
        question:
          "How is availability bias affecting your health anxiety?",
        insight:
          "The documentary made the disease vivid and easy to recall. But rare means rare. The base rate matters more than the vividness of the example. Check the statistics before scheduling the specialist.",
        category: "personal",
      },
      {
        prompt:
          "After the Fukushima disaster in 2011, Germany decided to shut down all its nuclear power plants.",
        question:
          "How did availability bias influence Germany's energy policy?",
        insight:
          "Fukushima was vivid and terrifying. But Germany's geology and safety record were fundamentally different. The decision led to increased reliance on coal and Russian gas — arguably more dangerous than nuclear. The vivid fear overrode the statistical analysis.",
        category: "historical",
      },
    ],
    keyQuestion:
      "Am I overweighting recent or vivid examples vs. the actual base rate?",
  },
  {
    slug: "lollapalooza-effect",
    name: "Lollapalooza Effect",
    tagline: "Multiple forces in the same direction create extreme, non-linear outcomes.",
    author: "Charlie Munger",
    era: "20th century",
    sourceBook: "Poor Charlie's Almanack",
    field: ["Systems Thinking", "Psychology / Cognitive Science"],
    domain: [
      "Business / Strategy",
      "Investing / Finance",
      "Management / Leadership",
      "General / Universal",
    ],
    theory:
      "Multiple forces acting in the same direction produce non-linear, extreme outcomes — for good or ill. One bias is manageable. Three biases plus social proof plus financial incentives all pointing the same way creates a lollapalooza: an outcome far larger than any single cause would predict.",
    metaphor:
      "One wave is manageable. But when multiple waves converge at the same point, they do not add — they multiply. That is a rogue wave. The lollapalooza effect is the rogue wave of human decision-making.",
    realExamples: [
      {
        type: "business",
        title: "The iPhone launch (2007)",
        description:
          "Superior product + social proof + status signalling + ecosystem lock-in + massive marketing. Each force alone would have been significant. Combined, they created a product category that consumed the mobile industry.",
      },
      {
        type: "personal",
        title: "Cult recruitment",
        description:
          "Isolation + authority + reciprocity + commitment/consistency + social proof. No single technique would trap a rational person. But all five together create a psychological prison that even smart people cannot escape.",
      },
      {
        type: "historical",
        title: "The Tulip Mania (1637)",
        description:
          "Novelty + scarcity + social proof + speculation + leverage. Each factor amplified the others. Tulip bulb prices hit 10x the annual income of a skilled worker before the inevitable collapse.",
      },
    ],
    selfCheckQuestions: [
      "How many independent factors are pushing in the same direction here?",
      "Is the outcome I am seeing the result of one big cause, or several causes combining?",
      "Am I being swept along by a confluence of biases, social proof, and incentives all pointing the same way?",
      "What would break the reinforcing loop if it is a bad one?",
    ],
    relatedModels: [
      { slug: "inversion", type: "combines_with" },
      { slug: "second-order-thinking", type: "combines_with" },
      { slug: "availability-bias", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "A new fintech app is seeing exponential growth: great UX + referral bonuses + celebrity endorsements + FOMO-driven social media.",
        question:
          "Is this sustainable growth or a lollapalooza that could reverse?",
        insight:
          "Count the forces: referral bonuses (financial incentive), celebrity endorsement (authority), social media (social proof), FOMO (scarcity/urgency). When multiple forces are artificial or temporary, the lollapalooza can reverse just as violently when one force disappears.",
        category: "business",
      },
      {
        prompt:
          "You find yourself increasingly committed to a bad relationship: you have moved in together, your friends are shared, and your identity is intertwined.",
        question:
          "What lollapalooza forces are keeping you stuck?",
        insight:
          "Sunk cost + social proof ('everyone thinks we are great together') + loss aversion + identity attachment + commitment/consistency bias. No single force would keep you. Combined, they make leaving feel impossible. Name them individually to weaken their collective grip.",
        category: "personal",
      },
      {
        prompt:
          "The 2008 housing bubble involved cheap credit, lax regulation, misaligned incentives, social proof, and herd behaviour.",
        question:
          "How did the lollapalooza effect produce an outcome no single factor could explain?",
        insight:
          "Cheap money (incentive) + everyone buying (social proof) + rising prices (confirmation) + AAA ratings (authority) + securitisation (complexity hiding risk). Each factor reinforced the others. The crash was not one failure — it was a lollapalooza of failures all pointing the same direction.",
        category: "historical",
      },
    ],
    keyQuestion:
      "How many forces are pointing in the same direction, and what happens if they all reverse?",
  },
  {
    slug: "opportunity-cost",
    name: "Opportunity Cost",
    tagline: "Every yes is a no to something else.",
    author: "Classical economists (Bastiat, Wieser)",
    era: "19th century",
    sourceBook: "Principles of Economics (various)",
    field: ["Economics"],
    domain: [
      "Investing / Finance",
      "Career Decisions",
      "Product / Design",
      "General / Universal",
    ],
    theory:
      "Every yes is a no to something else. The true cost of a decision includes what you gave up. Most people only see the direct cost. The invisible cost — the best available alternative foregone — is often larger.",
    metaphor:
      "Time and money are like a narrow doorway — only one thing can pass through at a time. Choosing what enters means choosing what stays outside. The thing left outside is the opportunity cost.",
    realExamples: [
      {
        type: "business",
        title: "Apple killing the iPod",
        description:
          "Apple cannibalised its own best-selling product by launching the iPhone. The opportunity cost of not building the iPhone — letting someone else do it — was far greater than the cost of killing iPod revenue.",
      },
      {
        type: "personal",
        title: "Spending 4 years on a degree you do not use",
        description:
          "The tuition is the visible cost. The opportunity cost is 4 years of career experience, income, and compound growth you gave up. For some paths, the degree is worth it. For many, the opportunity cost is the real price.",
      },
      {
        type: "historical",
        title: "Blockbuster passing on Netflix (2000)",
        description:
          "Blockbuster could have bought Netflix for $50 million. The opportunity cost of saying no was not $50M — it was the entire future of streaming. By the time they realised, the opportunity had compounded beyond reach.",
      },
    ],
    selfCheckQuestions: [
      "What am I giving up by choosing this — not just money, but time, attention, optionality?",
      "What is my best available alternative, and how does this compare to it?",
      "Is this the best use of my next dollar / hour / unit of energy?",
      "Would I still choose this if I had to explicitly write down what I am sacrificing?",
    ],
    relatedModels: [
      { slug: "margin-of-safety", type: "contrasts_with" },
      { slug: "second-order-thinking", type: "combines_with" },
      { slug: "probabilistic-thinking", type: "combines_with" },
    ],
    scenarios: [
      {
        prompt:
          "Your team is spending 40% of their time maintaining a legacy product that generates 10% of revenue.",
        question:
          "What is the opportunity cost of maintaining the legacy product?",
        insight:
          "The opportunity cost is not the maintenance budget — it is what that 40% of engineering time could build. If redirected to your growth product, what would the revenue impact be? The invisible cost dwarfs the visible one.",
        category: "business",
      },
      {
        prompt:
          "You have been offered two jobs: one pays $120K but is boring, the other pays $85K but excites you and has high growth potential.",
        question:
          "What is the true opportunity cost of choosing the higher-paying job?",
        insight:
          "The $35K salary difference is visible. The opportunity cost of the boring job includes: stunted skill growth, lower long-term earnings trajectory, reduced network quality, and years of disengagement. Price the invisible costs.",
        category: "personal",
      },
      {
        prompt:
          "In the 1960s, NASA consumed ~4.5% of the US federal budget for the Apollo program.",
        question:
          "What was the opportunity cost of the moon landing, and was it worth it?",
        insight:
          "The direct budget could have funded education, infrastructure, or poverty programs. But the second-order returns — semiconductor advances, materials science, GPS, national morale — arguably exceeded what any alternative investment would have produced. Opportunity cost is not always obvious.",
        category: "historical",
      },
    ],
    keyQuestion:
      "What is the best alternative foregone by making this choice?",
  },
];

// ── Connections ──────────────────────────────────────────────────────────────

export const MODEL_CONNECTIONS: ModelConnection[] = [
  { from: "inversion", to: "second-order-thinking", type: "combines_with" },
  { from: "inversion", to: "first-principles", type: "combines_with" },
  { from: "inversion", to: "lollapalooza-effect", type: "combines_with" },
  { from: "inversion", to: "margin-of-safety", type: "combines_with" },
  { from: "first-principles", to: "circle-of-competence", type: "prerequisite_for" },
  { from: "first-principles", to: "probabilistic-thinking", type: "combines_with" },
  { from: "circle-of-competence", to: "probabilistic-thinking", type: "combines_with" },
  { from: "circle-of-competence", to: "incentives", type: "combines_with" },
  { from: "second-order-thinking", to: "incentives", type: "combines_with" },
  { from: "second-order-thinking", to: "lollapalooza-effect", type: "combines_with" },
  { from: "probabilistic-thinking", to: "margin-of-safety", type: "combines_with" },
  { from: "probabilistic-thinking", to: "availability-bias", type: "contrasts_with" },
  { from: "probabilistic-thinking", to: "circle-of-competence", type: "prerequisite_for" },
  { from: "incentives", to: "lollapalooza-effect", type: "combines_with" },
  { from: "margin-of-safety", to: "opportunity-cost", type: "contrasts_with" },
  { from: "availability-bias", to: "lollapalooza-effect", type: "combines_with" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getModelBySlug(slug: string): MentalModel | undefined {
  return MENTAL_MODELS.find((m) => m.slug === slug);
}

export function getRelatedModels(
  slug: string
): { model: MentalModel; type: ConnectionType }[] {
  const model = getModelBySlug(slug);
  if (!model) return [];
  return model.relatedModels
    .map((rel) => {
      const related = getModelBySlug(rel.slug);
      return related ? { model: related, type: rel.type } : null;
    })
    .filter(Boolean) as { model: MentalModel; type: ConnectionType }[];
}

export function getModelOfTheDay(): MentalModel {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return MENTAL_MODELS[dayOfYear % MENTAL_MODELS.length];
}
