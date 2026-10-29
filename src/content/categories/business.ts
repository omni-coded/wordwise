import { defineCategory } from '../author';

export default defineCategory({
  id: 'business',
  name: 'Business & Entrepreneurship',
  shortName: 'Business',
  blurb: 'The language of strategy, operations, markets, and leadership.',
  glyph: '◈',
  references: [
    'Harvard Business Review glossaries and articles (hbr.org)',
    'U.S. Small Business Administration guides (sba.gov)',
    'Investor.gov glossary (U.S. Securities and Exchange Commission)',
    'Porter, M. — Competitive Strategy (1980)',
  ],
  topics: [
    {
      id: 'strategy',
      name: 'Strategy & Growth',
      connection:
        'A niche is where a business chooses to compete, a moat is what protects it, and positioning is how customers perceive it. Scalability, acquisition, and franchising are routes to growth, while a pivot is a deliberate change of direction. Benchmarks and stakeholders keep strategy honest.',
      rows: [
        ['Niche', 'NEESH', 2, 'A specialized segment of a market that a business serves particularly well.', 'A bakery that makes only gluten-free bread has carved out a profitable niche.', 'Small companies often succeed by dominating a niche that larger competitors overlook.', 'Choosing a clear niche helps new ventures compete without matching giants on size.'],
        ['Moat', 'MOHT', 2, 'A durable competitive advantage that protects a business from rivals, like water around a castle.', "Strong brand loyalty gives the company a moat that competitors struggle to cross.", 'Investor Warren Buffett popularized the term for businesses with lasting advantages, such as brands, patents, or network effects.', 'Understanding what makes an advantage durable helps founders and investors judge long-term prospects.'],
        ['Positioning', 'puh-ZISH-uh-ning', 3, 'The place a product or brand occupies in customers’ minds relative to its competitors.', 'Clear positioning lets a company be known as the premium option rather than the cheapest.', 'Marketers Al Ries and Jack Trout popularized the idea in a 1981 book of the same name.', 'Without deliberate positioning, customers decide for you, and often choose a rival.'],
        ['Scalability', 'skay-luh-BIL-ih-tee', 3, 'The ability of a business or system to handle growth without a matching rise in costs.', 'Software has high scalability because serving one more customer costs very little.', 'Investors often prize scalable models because revenue can grow much faster than expenses.', 'Founders who plan for scalability avoid being overwhelmed by their own success.'],
        ['Acquisition', 'ak-wih-ZISH-un', 3, 'The purchase of one company by another, or the process of gaining a new customer.', 'The larger firm announced the acquisition of a smaller competitor to enter a new market.', 'Companies use acquisition to gain technology, talent, or customers faster than building from scratch.', 'Knowing the term in both senses helps decode business news and marketing metrics.'],
        ['Franchise', 'FRAN-chyze', 2, 'A license to operate a business under an established brand and system in return for fees.', 'She opened a franchise of a well-known sandwich chain in her hometown.', 'Franchising lets a brand expand using other people’s capital, while franchisees get a proven model.', 'It is a way to start a business with support, though fees and rules reduce independence.'],
        ['Pivot', 'PIV-ut', 2, "A deliberate change in a company's strategy or product after learning from the market.", 'After users ignored its photo app, the startup made a pivot into business messaging.', 'The term was popularized in startup circles by Eric Ries and his Lean Startup method.', 'Knowing when to change direction can be the difference between survival and failure.'],
        ['Benchmark', 'BENCH-mark', 3, 'A standard or point of reference used to measure and compare performance.', 'The company used the industry average as a benchmark for its customer service times.', 'The word began as a surveyors’ mark cut into stone to serve as a reference for measuring elevations.', 'Without benchmarks, it is hard to know whether results are good or just familiar.'],
        ['Stakeholder', 'STAYK-hohl-der', 3, 'Any person or group affected by, or able to affect, an organization’s decisions.', 'Employees, customers, suppliers, and investors are all stakeholder groups of a company.', 'Philosopher R. Edward Freeman’s 1984 book on stakeholder theory broadened how firms think about responsibility.', 'Mapping stakeholders early prevents unpleasant surprises when a decision affects them.'],
        ['Disruption', 'dis-RUP-shun', 3, 'The upending of an established market by a new product, technology, or business model.', 'Streaming brought disruption to video rental stores that relied on physical discs.', 'Clayton Christensen’s theory of disruptive innovation described how simple, cheap products can displace established leaders.', 'Spotting disruption early helps both incumbents and challengers decide where to invest.'],
      ],
    },
    {
      id: 'operations-finance',
      name: 'Operations & Finance',
      connection:
        'Revenue is what comes in, overhead and procurement are what it costs to operate, and margin is what is left. Inventory and logistics move physical goods, outsourcing buys capabilities from others, and an audit checks the numbers. Bootstrapping is how many founders fund all of it without outside investors.',
      rows: [
        ['Revenue', 'REV-uh-noo', 1, 'The total income a business earns from selling goods or services before costs are deducted.', 'The store’s revenue rose by ten percent after it added an online shop.', 'Revenue is often called the top line because it sits at the top of an income statement.', 'Growing revenue is not the same as growing profit, so both must be tracked.'],
        ['Margin', 'MAR-jin', 2, 'The portion of revenue left as profit after certain costs are subtracted, usually expressed as a percentage.', 'A thin margin means even a small rise in costs can erase the profit.', 'Gross margin counts only the direct costs of making a product, while net margin counts all costs, interest, and taxes.', 'Comparing margins reveals which products or businesses are truly profitable.'],
        ['Overhead', 'OH-ver-hed', 2, 'Ongoing business costs, such as rent, utilities, and administration, that are not tied directly to a particular product.', 'Moving to a cheaper office cut the firm’s overhead by a third.', 'Overhead must be covered whether the business sells a lot or a little, which is why high fixed costs are risky.', 'Controlling it frees money for growth and protects against slow periods.'],
        ['Procurement', 'proh-KYOOR-ment', 4, 'The process of finding and acquiring the goods and services a business needs.', 'The procurement team negotiated lower prices from three suppliers.', 'Large organizations often use competitive bidding in procurement to get the best value and prevent favoritism.', 'Smart sourcing reduces costs, improves quality, and lowers supply risk.'],
        ['Inventory', 'IN-ven-tor-ee', 2, 'The goods a business holds for sale or for use in making products.', 'Holding too much inventory ties up cash, while holding too little risks lost sales.', 'The just-in-time method, associated with Toyota, aims to cut inventory by receiving parts only as they are needed.', 'Good management balances cash flow against the ability to meet demand.'],
        ['Logistics', 'loh-JIS-tiks', 3, 'The planning and management of how goods move and are stored between suppliers and customers.', 'Fast, reliable logistics allows an online store to promise delivery within two days.', 'The term comes from military supply operations, where moving food, fuel, and equipment decided campaigns.', 'Logistics can make or break customer satisfaction and cost structure.'],
        ['Outsourcing', 'OWT-sor-sing', 3, 'Hiring an outside company or person to perform work that could be done in-house.', 'The startup relied on outsourcing for payroll and customer support so it could focus on product design.', 'Outsourcing can cut costs and add expertise, but it also requires careful oversight and clear contracts.', 'Deciding what to keep in-house is a core strategic choice for growing firms.'],
        ['Audit', 'AW-dit', 2, 'An independent examination of financial records or processes to check accuracy and compliance.', 'External accountants conduct an annual audit of the company’s books.', 'The word comes from the Latin audire, “to hear,” because early auditors listened to officials read out their accounts.', 'Audits build trust among investors, lenders, regulators, and the public.'],
        ['Bootstrapping', 'BOOT-strap-ing', 3, 'Building and funding a business with personal savings and early revenue rather than outside investment.', 'By bootstrapping, the founders kept full ownership, though growth was slower.', 'The phrase comes from the idea of lifting oneself up by one’s own bootstraps.', 'It forces discipline and preserves control, though it can limit how fast a company grows.'],
        ['Liquidation', 'lik-wih-DAY-shun', 4, 'The process of closing a business and selling its assets to pay off its debts.', 'After the company failed, liquidation of its equipment repaid part of what it owed.', 'In many legal systems, secured creditors are paid before ordinary shareholders in a liquidation.', 'Understanding the order of payment helps investors and lenders weigh their risk.'],
      ],
    },
    {
      id: 'marketing-people',
      name: 'Marketing & People',
      connection:
        'Branding and segmentation shape how a business is seen and who it targets, while retention and churn measure whether customers stay. Onboarding welcomes new customers and employees alike, and leadership, delegation, negotiation, and mentorship are the skills that let an entrepreneur turn a venture into a team.',
      rows: [
        ['Branding', 'BRAN-ding', 2, 'The practice of shaping the name, look, voice, and reputation by which a business is recognized.', 'Consistent branding makes a company instantly recognizable on a shelf or a screen.', 'The word comes from the old practice of burning an owner’s mark into livestock.', 'A strong brand lets a business charge more and win trust faster.'],
        ['Segmentation', 'seg-men-TAY-shun', 3, 'Dividing a market into groups of customers who share needs or characteristics.', 'Segmentation by age and income showed that the premium model appealed to a narrow audience.', 'Common bases include demographics, geography, behavior, and attitudes.', 'It allows marketers to tailor messages instead of speaking to everyone and no one.'],
        ['Retention', 'rih-TEN-shun', 3, 'A business’s ability to keep existing customers or employees over time.', 'Higher customer retention means fewer new customers are needed just to stay the same size.', 'Keeping a customer is generally cheaper than winning a new one, which is why many firms track retention closely.', 'Retention reveals whether a product truly delivers lasting value.'],
        ['Churn', 'CHURN', 3, 'The rate at which customers stop buying or cancel a subscription.', 'A monthly churn of two percent means the company loses one in fifty subscribers each month.', 'Subscription businesses watch churn closely because even small rates compound over a year.', 'Reducing churn is often the fastest route to sustainable growth.'],
        ['Onboarding', 'ON-bor-ding', 3, 'The process of helping a new customer or employee get started and become productive.', 'Good onboarding helps new hires understand their role within the first weeks.', 'Many software products measure onboarding success by how quickly users reach their first useful result.', 'A smooth first experience lowers early drop-off and builds loyalty.'],
        ['Delegation', 'del-ih-GAY-shun', 2, 'Assigning responsibility and authority for a task to someone else.', 'Effective delegation means explaining the goal and trusting the person to find the method.', 'Founders often struggle with delegation because they feel no one will care as much as they do.', 'Learning to delegate is essential for leaders who want their organizations to grow beyond them.'],
        ['Negotiation', 'nih-goh-shee-AY-shun', 3, 'A discussion aimed at reaching an agreement that both sides can accept.', 'Careful preparation is the best predictor of success in any negotiation.', 'The book Getting to Yes advocates focusing on interests rather than fixed positions.', 'Negotiation skills affect salaries, contracts, partnerships, and daily workplace decisions.'],
        ['Mentorship', 'MEN-tor-ship', 2, 'A relationship in which an experienced person guides the professional growth of a less experienced one.', 'Her mentorship with a retired executive helped her avoid common founder mistakes.', 'The word comes from Mentor, a character in Homer’s Odyssey who advises Odysseus’s son.', 'Good mentors share lessons, open doors, and offer honest feedback.'],
        ['Entrepreneur', 'on-truh-pruh-NUR', 2, 'A person who starts and takes on the risk of running a new business.', 'The entrepreneur mortgaged her home to launch the company.', 'The word comes from the French entreprendre, meaning “to undertake.”', 'Entrepreneurs create jobs and innovation, but also face high rates of failure.'],
        ['Leadership', 'LEE-der-ship', 2, 'The ability to guide, motivate, and align a group of people toward shared goals.', 'Good leadership shows up in how a manager handles setbacks, not just successes.', 'Research on leadership often separates task-focused behaviors, such as setting goals, from people-focused behaviors, such as listening and support.', 'Organizations with strong leaders tend to retain talent and adapt to change more effectively.'],
      ],
    },
  ],
});
