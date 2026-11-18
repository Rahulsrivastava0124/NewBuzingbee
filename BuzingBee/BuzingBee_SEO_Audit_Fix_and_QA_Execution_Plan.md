# BuzingBee.com SEO Audit, Fix & QA Execution Plan

**Project:** https://buzingbee.com/\
**Purpose:** Give an AI coding/SEO agent and human reviewer a testable
plan to inspect, fix, validate and report SEO improvements.\
**Source baseline:** Google Search Console export dated 18 November
2026, covering 17 August--16 November 2026.\
**Execution rule:** Do not mark a task PASS without evidence. Use
`PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED`.

------------------------------------------------------------------------

## 0. Instructions for the AI agent

You are auditing and improving BuzingBee.com. Work in small, reversible
steps.

1.  Inspect the live website and repository before changing anything.
2.  Confirm the framework, routing, CMS, deployment process and existing
    SEO implementation. Do not assume the stack.
3.  Treat the Search Console figures below as the historical baseline,
    not live/current metrics.
4.  Do not invent clients, reviews, certifications, case studies,
    locations, business addresses, phone numbers, statistics or campaign
    results.
5.  Do not create doorway pages, near-duplicate city pages,
    keyword-stuffed content, fake schema, paid-link schemes or mass
    AI-generated articles.
6.  Preserve existing URLs unless a migration is justified. If a URL
    must change, provide a redirect and migration test.
7.  Before editing, record the current title, meta description,
    canonical, H1, indexability, internal links and page content for
    each target URL.
8.  After each change, run the relevant tests and attach evidence: URL,
    screenshot, command output, HTML excerpt, Search Console export or
    test result.
9.  If access, data or proof is missing, mark the task `BLOCKED`; do not
    guess.
10. Do not promise Google position #1. The goal is improved relevance,
    visibility, clicks and qualified enquiries.

### Status definitions

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  `PASS`                              Test completed and acceptance
                                      criteria met; evidence recorded.

  `FAIL`                              Test completed and acceptance
                                      criteria not met; remediation
                                      required.

  `BLOCKED`                           Cannot test or implement because
                                      access, approval or evidence is
                                      missing.

  `NOT TESTED`                        Work has not yet been performed.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 1. Search Console baseline

### 1.1 Performance summary

  Metric                          Baseline
  ------------------ ---------------------
  Clicks                                84
  Impressions                        4,740
  CTR                                1.77%
  Average position                     7.1
  Reporting window     17 Aug--16 Nov 2026

CTR calculation: `84 / 4,740 × 100 = 1.77%`.

### 1.2 Important page data from `Pages.csv`

  Page                               Clicks   Impressions     CTR   Average position
  -------------------------------- -------- ------------- ------- ------------------
  Homepage `/`                           70         4,107   1.70%               6.11
  Dhanbad guide                           5           388   1.29%               8.46
  Blog index `/blog`                      4           162   2.47%               6.61
  India agency list article               2            60   3.33%              21.77
  Contact `/contact`                      1           109   0.92%               3.11
  Facebook vs Google Ads article          0           162      0%              10.71
  Portfolio `/portfolio`                  0           129      0%               3.72
  Services `/services`                    0           112      0%               3.19
  Pricing `/pricing`                      0            55      0%               6.33

**Interpretation caution:** Page-level and query-level exports do not
necessarily sum to the property totals. Do not combine the totals from
different report dimensions.

### 1.3 Important query data from `Queries.csv`

  Query                                     Clicks   Impressions      CTR   Average position
  --------------------------------------- -------- ------------- -------- ------------------
  `buzingbee`                                   33           131   25.19%               5.39
  `digital marketing agency in dhanbad`          8           201    3.98%               3.81
  `digital marketing`                            0         1,284       0%               3.80
  `social media marketing`                       0           879       0%               3.80
  `digital marketing agency`                     1            59    1.69%               2.54
  `Dhanbad digital marketing`                    0            64       0%              35.25
  `graphic design`                               0            47       0%               4.60
  `compare Google Ads vs Facebook Ads`           0            18       0%               6.28

**Mandatory investigation:** The generic queries `digital marketing` and
`social media marketing` have high impressions and zero clicks despite
reported average positions of 3.80. Do not immediately rewrite the
homepage around these terms. First inspect the exact query-to-page
association, country, device, date, search appearance, and whether the
impressions are relevant to BuzingBee's intended audience.

### 1.4 Device data

  Device      Clicks   Impressions      CTR   Average position
  --------- -------- ------------- -------- ------------------
  Desktop         41         3,656    1.12%               7.27
  Mobile          41         1,064    3.85%               6.56
  Tablet           2            15   13.33%               7.27

Investigate desktop CTR by query and page. This is a search-result CTR
observation, not proof of a desktop page-speed or usability issue.

### 1.5 Country data

India: 82 clicks / 4,318 impressions / 1.90% CTR / average position
6.42.\
United States: 0 clicks / 199 impressions.\
Australia: 1 click / 24 impressions.

Initial market focus should be India unless the business owner confirms
another target market.

------------------------------------------------------------------------

## 2. Phase 0 --- Access, discovery and safety

  -----------------------------------------------------------------------------
  ID             Check / action Test case and     Status         Evidence /
                                acceptance                       notes
                                criteria                         
  -------------- -------------- ----------------- -------------- --------------
  P0-01          Confirm        Correct           NOT TESTED     
                 repository and production                       
                 deployment     repository and                   
                 access         deployment target                
                                identified.                      

  P0-02          Identify       Document actual   NOT TESTED     
                 framework, CMS stack, route                     
                 and routing    source and                       
                                content source.                  

  P0-03          Capture        Save homepage and NOT TESTED     
                 current        target-page                      
                 production     screenshots, HTML                
                 state          and metadata                     
                                before changes.                  

  P0-04          Confirm        Search Console    NOT TESTED     
                 analytics      property and GA4                 
                 access         property                         
                                verified.                        

  P0-05          Confirm        Owner confirms    NOT TESTED     
                 business facts official name,                   
                                phone,                           
                                address/service                  
                                area, services,                  
                                markets and                      
                                approved claims.                 

  P0-06          Back up before Restore point or  NOT TESTED     
                 changes        version-control                  
                                commit exists.                   

  P0-07          Check security Review Search     NOT TESTED     
                 and manual     Console Security                 
                 actions        Issues and Manual                
                                Actions. Any                     
                                issue is                         
                                escalated before                 
                                SEO content work.                
  -----------------------------------------------------------------------------

**Gate:** Do not publish business facts or case-study claims until P0-05
is approved.

------------------------------------------------------------------------

## 3. Phase 1 --- Technical SEO checks and fixes

### 3.1 Crawlability and indexation

  ----------------------------------------------------------------------------------------------------------
  ID          Check / fix    Test case                             PASS criteria     Status      Evidence
  ----------- -------------- ------------------------------------- ----------------- ----------- -----------
  T-01        `robots.txt`   Request                               Returns HTTP 200  NOT TESTED  
                             `https://buzingbee.com/robots.txt`.   and does not                  
                                                                   accidentally                  
                                                                   block important               
                                                                   pages or assets.              

  T-02        XML sitemap    Request sitemap URL and inspect       Valid XML; only   NOT TESTED  
                             entries.                              canonical,                    
                                                                   indexable,                    
                                                                   intended URLs;                
                                                                   returns HTTP 200.             

  T-03        Sitemap        Check Search Console Sitemaps report. Correct sitemap   NOT TESTED  
              submission                                           submitted; no                 
                                                                   unresolved                    
                                                                   processing                    
                                                                   errors.                       

  T-04        Canonical tags Inspect homepage, service, blog,      Each indexable    NOT TESTED  
                             contact and portfolio pages.          page has an                   
                                                                   appropriate                   
                                                                   absolute                      
                                                                   canonical URL.                

  T-05        Indexability   Inspect `meta robots` and             Important pages   NOT TESTED  
                             `X-Robots-Tag`.                       are not                       
                                                                   accidentally                  
                                                                   `noindex` or                  
                                                                   blocked.                      

  T-06        URL variants   Test HTTP/HTTPS and www/non-www       One preferred     NOT TESTED  
                             variants.                             HTTPS host; other             
                                                                   variants redirect             
                                                                   consistently in               
                                                                   one hop.                      

  T-07        Broken URLs    Crawl internal links and sitemap      No important      NOT TESTED  
                             URLs.                                 internal link                 
                                                                   returns 4xx/5xx;              
                                                                   intentional                   
                                                                   removed URLs have             
                                                                   appropriate                   
                                                                   redirects or                  
                                                                   404/410.                      

  T-08        Redirect       Crawl redirecting URLs.               No avoidable      NOT TESTED  
              chains                                               multi-hop chains              
                                                                   or redirect                   
                                                                   loops.                        

  T-09        Orphan pages   Compare crawl results with sitemap    Important landing NOT TESTED  
                             and internal links.                   pages are                     
                                                                   discoverable                  
                                                                   through relevant              
                                                                   internal links.               

  T-10        Search Console Inspect key URLs individually.        Google-selected   NOT TESTED  
              URL inspection                                       canonical and                 
                                                                   indexing status               
                                                                   are understood;               
                                                                   unexpected                    
                                                                   exclusions are                
                                                                   investigated.                 
  ----------------------------------------------------------------------------------------------------------

### 3.2 Metadata and page structure

  --------------------------------------------------------------------------------
  ID          Check / fix    Test case     PASS criteria   Status      Evidence
  ----------- -------------- ------------- --------------- ----------- -----------
  T-11        Unique title   Crawl all     Each important  NOT TESTED  
              tags           indexable     page has a                  
                             pages.        unique,                     
                                           accurate title              
                                           matching its                
                                           purpose.                    

  T-12        Meta           Crawl all     Unique, useful  NOT TESTED  
              descriptions   important     descriptions;               
                             pages.        no keyword                  
                                           stuffing or                 
                                           unsupported                 
                                           claims.                     

  T-13        H1             Inspect       One clear       NOT TESTED  
                             rendered HTML primary H1 that             
                             for each      accurately                  
                             landing page. describes the               
                                           page.                       

  T-14        Heading        Inspect H2/H3 Headings        NOT TESTED  
              hierarchy      order.        describe                    
                                           content                     
                                           sections; no                
                                           styling-only                
                                           heading misuse.             

  T-15        Image alt text Review        Descriptive alt NOT TESTED  
                             meaningful    text for                    
                             images.       informative                 
                                           images;                     
                                           decorative                  
                                           images have                 
                                           empty alt.                  

  T-16        Open Graph     Inspect       Important share NOT TESTED  
                             title,        pages have                  
                             description   accurate OG                 
                             and image     metadata and                
                             metadata.     valid image                 
                                           URLs.                       

  T-17        Language and   Inspect       Correct         NOT TESTED  
              viewport       rendered      document                    
                             HTML.         language and                
                                           responsive                  
                                           viewport                    
                                           declaration.                

  T-18        Internal links Crawl key     Important       NOT TESTED  
                             pages.        service pages               
                                           receive                     
                                           contextual                  
                                           links; anchor               
                                           text is                     
                                           descriptive and             
                                           natural.                    
  --------------------------------------------------------------------------------

### 3.3 Structured data

  ---------------------------------------------------------------------------------
  ID          Check / fix     Test case      PASS criteria  Status      Evidence
  ----------- --------------- -------------- -------------- ----------- -----------
  T-19        Organization    Validate       Valid schema;  NOT TESTED  
              schema          JSON-LD        name, URL,                 
                              against        logo and                   
                              visible,       contact facts              
                              approved       match the                  
                              business       site.                      
                              details.                                  

  T-20        LocalBusiness   Only implement Schema         NOT TESTED  
              schema          if the         accurately                 
                              business is    represents the             
                              eligible and   real business;             
                              has verified   no invented                
                              location       address or                 
                              details.       service area.              

  T-21        Service schema  Validate       Schema         NOT TESTED  
                              service pages. describes                  
                                             actual visible             
                                             services and               
                                             does not imply             
                                             guaranteed                 
                                             rankings.                  

  T-22        Article schema  Validate blog  Headline,      NOT TESTED  
                              posts.         author, dates              
                                             and image                  
                                             match visible              
                                             article                    
                                             content.                   

  T-23        Breadcrumb      Validate pages Breadcrumb     NOT TESTED  
              schema          with visible   data matches               
                              breadcrumbs.   actual page                
                                             hierarchy and              
                                             links.                     

  T-24        Review/rating   Inspect any    Only genuine,  NOT TESTED  
              markup          review schema. eligible                   
                                             reviews are                
                                             marked up; no              
                                             self-serving               
                                             fake ratings.              
  ---------------------------------------------------------------------------------

### 3.4 Performance and mobile experience

  -------------------------------------------------------------------------------------
  ID          Check / fix     Test case       PASS criteria     Status      Evidence
  ----------- --------------- --------------- ----------------- ----------- -----------
  T-25        Core Web Vitals Test key        Record LCP, INP   NOT TESTED  
                              templates in    and CLS; aim for              
                              PageSpeed       LCP ≤2.5s, INP                
                              Insights and    ≤200ms, CLS ≤0.1              
                              field data      at the 75th                   
                              where           percentile where              
                              available.      field data                    
                                              exists.                       

  T-26        Image           Inspect largest Correct           NOT TESTED  
              optimization    images and      dimensions;                   
                              formats.        responsive                    
                                              images; efficient             
                                              WebP/AVIF where               
                                              supported.                    

  T-27        Font loading    Inspect font    Avoid unnecessary NOT TESTED  
                              requests and    font weights; use             
                              layout shifts.  appropriate                   
                                              preload only for              
                                              critical fonts.               

  T-28        JavaScript      Inspect bundles No critical       NOT TESTED  
                              and browser     runtime errors;               
                              console.        defer or reduce               
                                              non-critical                  
                                              scripts where                 
                                              appropriate.                  

  T-29        Mobile layout   Test main       No horizontal     NOT TESTED  
                              templates at    overflow;                     
                              common mobile   readable text;                
                              widths.         usable navigation             
                                              and CTAs.                     

  T-30        Desktop layout  Test main       No overlap,       NOT TESTED  
                              templates at    clipped content               
                              common desktop  or unusable                   
                              widths.         controls.                     

  T-31        Forms           Submit valid    Validation works; NOT TESTED  
                              and invalid     success/failure               
                              test enquiries  states are clear;             
                              in a safe test  no data loss or               
                              environment.    console errors.               

  T-32        Accessibility   Keyboard test,  Interactive       NOT TESTED  
              basics          labels,         elements are                  
                              contrast and    keyboard                      
                              image           accessible and                
                              alternatives.   form fields have              
                                              labels.                       
  -------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 4. Phase 2 --- Keyword mapping and content architecture

### 4.1 Keyword-to-page mapping

Use one primary search intent per page. These are proposed targets, not
confirmed keyword-volume opportunities.

  ---------------------------------------------------------------------------
  Page / proposed URL         Primary topic           Action
  --------------------------- ----------------------- -----------------------
  `/`                         BuzingBee digital       Clarify positioning; do
                              growth agency / primary not target every
                              core service            service equally.

  Existing Dhanbad guide      Digital marketing       Improve the existing
                              agency in Dhanbad ---   article and preserve
                              informational selection its URL.
                              guide                   

  `/services`                 Digital marketing       Make this a clear
                              services                service hub linking to
                                                      detailed pages.

  `/portfolio`                BuzingBee portfolio /   Add verified work and
                              project work            case studies.

  `/pricing`                  Digital marketing       Explain actual
                              pricing                 packages, scope and
                                                      variables.

  `/contact`                  Contact BuzingBee       Improve trust, contact
                                                      accuracy and enquiry
                                                      flow.

  Existing Ads comparison     Google Ads vs           Improve comparison,
  article                     Meta/Facebook Ads       search intent and
                                                      title.

  `/seo-services`             SEO services            Create only if this is
                                                      a real service.

  `/social-media-marketing`   Social media marketing  Create only if this is
                                                      a real service.

  `/google-ads-management`    Google Ads management   Create only if this is
                                                      a real service.

  `/website-development`      Website development     Create only if this is
                                                      a real service.

  `/lead-generation`          Lead generation         Create only if this is
                                                      a real service.

  `/ai-automation`            AI automation           Create only if this is
                                                      a real service.
  ---------------------------------------------------------------------------

**Location-page rule:** Dhanbad has demonstrated query visibility in the
supplied report. Do not create duplicate Dhanbad pages without checking
the existing guide's intent and performance. Create Kolkata/Jharkhand
pages only if the company genuinely serves those markets and can provide
distinct, useful local evidence. Avoid city-name-swapped doorway pages.

### 4.2 Content quality acceptance criteria

Every important service or article page must pass these checks:

-   [ ] Search intent is identified and satisfied.
-   [ ] Content is original and useful; not spun or copied.
-   [ ] Claims, numbers, certifications and testimonials are verifiable.
-   [ ] Page explains actual process, deliverables and limitations.
-   [ ] Relevant examples or evidence are included where available.
-   [ ] Clear author/business responsibility is shown where appropriate.
-   [ ] Internal links point to relevant services and supporting
    resources.
-   [ ] CTA is relevant and not deceptive.
-   [ ] No unnatural keyword repetition.
-   [ ] No unsupported "best", "#1", guaranteed traffic or guaranteed
    ranking claims.
-   [ ] Page is useful even if the reader does not hire BuzingBee.

### 4.3 Existing page work queue

  ------------------------------------------------------------------------------------
  ID             URL / page     Work                   Acceptance       Status
                                                       criteria         
  -------------- -------------- ---------------------- ---------------- --------------
  C-01           Homepage `/`   Confirm primary        Accurate         NOT TESTED
                                business positioning   business         
                                and rewrite            proposition; one 
                                title/H1/description   clear primary    
                                if needed.             H1; links to     
                                                       main services.   

  C-02           Dhanbad guide  Improve existing guide Helpful          NOT TESTED
                                with local business    informational    
                                needs, service         page; preserves  
                                evaluation,            URL; no          
                                costs/variables, FAQs  fabricated local 
                                and evidence.          claims.          

  C-03           Ads comparison Update comparison of   Balanced,        NOT TESTED
                 article        Google Ads and Meta    accurate         
                                Ads with use cases,    comparison;      
                                trade-offs and         title matches    
                                measurement.           intent; links to 
                                                       relevant         
                                                       service.         

  C-04           `/services`    Improve as a service   Clear service    NOT TESTED
                                hub.                   summaries and    
                                                       links to         
                                                       distinct detail  
                                                       pages.           

  C-05           `/portfolio`   Add verified projects  Each published   NOT TESTED
                                and evidence.          project has      
                                                       permission and   
                                                       substantiated    
                                                       details.         

  C-06           `/pricing`     Explain pricing model, No fabricated    NOT TESTED
                                inclusions, exclusions prices; pricing  
                                and variables.         information is   
                                                       clear and        
                                                       current.         

  C-07           `/contact`     Verify phone, email,   Details match    NOT TESTED
                                forms and business     owner-approved   
                                details.               source; forms    
                                                       work.            

  C-08           Blog index     Improve categorization Useful           NOT TESTED
                                and discovery.         categories and   
                                                       crawlable links; 
                                                       no thin tag      
                                                       pages.           
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 5. Phase 3 --- CTR improvement experiments

### 5.1 Prioritized CTR opportunities

  -------------------------------------------------------------------------------
  Priority                Page/query evidence         Proposed action
  ----------------------- --------------------------- ---------------------------
  P1                      Homepage: 4,107             Review query mix; clarify
                          impressions, 1.70% CTR      title and snippet around
                                                      approved primary service.

  P1                      Dhanbad guide: 388          Make title clearly promise
                          impressions, 1.29% CTR      a useful selection guide,
                                                      not an unsupported ranking.

  P1                      Services: 112 impressions,  Inspect associated queries
                          0 clicks                    and snippet before editing.

  P1                      Portfolio: 129 impressions, Inspect query relevance;
                          0 clicks                    improve page title and
                                                      visible project proof.

  P2                      Contact: 109 impressions,   Check query intent and
                          0.92% CTR                   snippet; improve accurate
                                                      brand/contact messaging.

  P2                      Ads comparison: 162         Test a concise comparison
                          impressions, 0 clicks       title that matches the
                                                      article.

  Investigate             `digital marketing`: 1,284  Query/page/device/country
                          impressions, 0 clicks       investigation before
                                                      content changes.

  Investigate             `social media marketing`:   Query/page/device/country
                          879 impressions, 0 clicks   investigation before
                                                      content changes.
  -------------------------------------------------------------------------------

### 5.2 Example title drafts --- approval required

These are drafts only. Confirm actual services and page content before
publishing.

  -------------------------------------------------------------------------------------------------
  Page                                Draft title
  ----------------------------------- -------------------------------------------------------------
  Homepage                            `BuzingBee | Digital Marketing, Development & AI Solutions`

  Dhanbad guide                       `Digital Marketing Agency in Dhanbad: How to Choose`

  Ads comparison                      `Google Ads vs Meta Ads: Which Is Right for Your Business?`

  Services                            `Digital Marketing Services | BuzingBee`

  Portfolio                           `Our Work & Case Studies | BuzingBee`

  Pricing                             `Digital Marketing Pricing & Packages | BuzingBee`
  -------------------------------------------------------------------------------------------------

**CTR experiment rules:**

1.  Record current title, description, clicks, impressions, CTR and
    average position before changes.
2.  Group results by query, page, device and country where data allows.
3.  Change only relevant page elements; do not change title, content,
    URL and internal links simultaneously without documenting the
    experiment.
4.  Annotate the deployment date.
5.  Compare a suitable post-change period with a comparable baseline;
    account for seasonality and demand changes.
6.  Do not declare success from a handful of impressions.
7.  Remember Google may generate a different title link or snippet.

### 5.3 Desktop CTR investigation

-   [ ] Export Search Console data filtered to Desktop.
-   [ ] Compare top desktop queries with Mobile for the same period.
-   [ ] Compare page-level CTR by device.
-   [ ] Inspect actual search snippets and search features.
-   [ ] Check whether desktop queries are informational, irrelevant or
    outside target markets.
-   [ ] Do not infer page speed from CTR alone.

------------------------------------------------------------------------

## 6. Phase 4 --- Internal linking

  -----------------------------------------------------------------------
  ID                Action            Test / acceptance Status
                                      criteria          
  ----------------- ----------------- ----------------- -----------------
  L-01              Homepage to       Links are         NOT TESTED
                    service hub and   visible,          
                    priority services crawlable HTML    
                                      links with        
                                      descriptive       
                                      anchors.          

  L-02              Service hub to    Every real        NOT TESTED
                    service detail    priority service  
                    pages             is linked.        

  L-03              Relevant blogs to Links are         NOT TESTED
                    service pages     contextually      
                                      relevant and      
                                      useful.           

  L-04              Dhanbad guide to  Link supports     NOT TESTED
                    relevant          reader's next     
                    service/contact   step without      
                                      forcing sales     
                                      copy.             

  L-05              Case studies to   Reader can        NOT TESTED
                    relevant service  understand the    
                    pages             service behind    
                                      each project.     

  L-06              Breadcrumbs where Visible hierarchy NOT TESTED
                    useful            and structured    
                                      data agree.       

  L-07              Broken internal   Crawl reports no  NOT TESTED
                    links             broken important  
                                      internal links.   
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Phase 5 --- Authority, local SEO and trust

  ------------------------------------------------------------------------
  ID                Action            Acceptance         Status
                                      criteria           
  ----------------- ----------------- ------------------ -----------------
  A-01              Confirm official  Owner-approved     NOT TESTED
                    business name,    facts are          
                    phone, address    consistent on      
                    and service areas website and        
                                      profiles.          

  A-02              Google Business   Profile is         NOT TESTED
                    Profile           eligible, verified 
                                      and accurately     
                                      maintained; no     
                                      fake address or    
                                      category.          

  A-03              Reviews           Reviews are        NOT TESTED
                                      genuine and        
                                      displayed with     
                                      permission; no     
                                      fabricated         
                                      testimonials.      

  A-04              Case studies      Client permission  NOT TESTED
                                      and evidence exist 
                                      for every          
                                      published claim.   

  A-05              Certifications    Certification is   NOT TESTED
                                      current and linked 
                                      to verifiable      
                                      proof where        
                                      possible.          

  A-06              Relevant          Links are          NOT TESTED
                    backlinks         editorially earned 
                                      and relevant; no   
                                      bulk spam schemes. 

  A-07              Local citations   Legitimate         NOT TESTED
                                      profiles use       
                                      consistent         
                                      approved business  
                                      details.           

  A-08              Partnerships      Real               NOT TESTED
                                      partner/customer   
                                      mentions are       
                                      documented.        

  A-09              Suspicious query  Inspect Security   NOT TESTED
                    investigation     Issues, Manual     
                                      Actions, indexed   
                                      URLs and site      
                                      files; escalate    
                                      confirmed          
                                      compromise.        
  ------------------------------------------------------------------------

Do not buy bulk backlinks, use private blog networks, fabricate reviews,
or create fake local offices.

------------------------------------------------------------------------

## 8. Phase 6 --- Analytics and conversion measurement

  -----------------------------------------------------------------------
  ID                Action            Test / acceptance Status
                                      criteria          
  ----------------- ----------------- ----------------- -----------------
  M-01              Verify GA4        Correct property  NOT TESTED
                                      and production    
                                      data stream.      

  M-02              Track enquiry     A successful form NOT TESTED
                    form submission   submission fires  
                                      one conversion    
                                      event.            

  M-03              Track phone       Click-to-call     NOT TESTED
                    clicks            event fires only  
                                      when phone link   
                                      is activated.     

  M-04              Track email       Email link event  NOT TESTED
                    clicks            fires when        
                                      activated.        

  M-05              Track WhatsApp or Event fires       NOT TESTED
                    messaging CTA if  accurately; no    
                    present           duplicate         
                                      conversions.      

  M-06              Test lead         Test enquiry      NOT TESTED
                    delivery          reaches the       
                                      correct business  
                                      destination.      

  M-07              Exclude           Reports are not   NOT TESTED
                    internal/test     materially        
                    traffic where     polluted by       
                    appropriate       internal testing. 

  M-08              Create monthly    Clicks,           NOT TESTED
                    SEO report        impressions, CTR, 
                                      position, landing 
                                      pages and leads   
                                      shown with date   
                                      range.            
  -----------------------------------------------------------------------

**Conversion rule:** A button click is not automatically a qualified
lead. Track completed enquiries separately from CTA interactions.

------------------------------------------------------------------------

## 9. Phase 7 --- 90-day execution schedule

### Days 1--7: Baseline and urgent fixes

-   [ ] Confirm repository, access and backup.
-   [ ] Confirm real business facts and primary market.
-   [ ] Inspect query-to-page mapping for high-impression zero-click
    terms.
-   [ ] Audit homepage title, H1, description and canonical.
-   [ ] Verify phone/contact details.
-   [ ] Inspect robots, sitemap, indexability and Search Console
    security.
-   [ ] Test enquiry forms and analytics events.

**Gate:** No unsupported claims or unapproved business facts published.

### Days 8--30: Existing page improvements

-   [ ] Improve homepage.
-   [ ] Improve Dhanbad guide.
-   [ ] Improve Google Ads vs Meta Ads article.
-   [ ] Improve Services page and internal links.
-   [ ] Improve Portfolio with verified projects.
-   [ ] Improve Pricing and Contact pages.
-   [ ] Fix critical technical issues.
-   [ ] Record deployment dates and before/after metadata.

**Gate:** All changed pages pass technical, content and conversion QA.

### Days 31--60: Service architecture and content

-   [ ] Publish priority service pages only for real services.
-   [ ] Add supporting internal links.
-   [ ] Publish up to four original, researched articles if quality and
    evidence are available.
-   [ ] Add approved case studies.
-   [ ] Improve legitimate local presence.
-   [ ] Recheck indexing and canonical selection.

**Gate:** No duplicate/doorway pages; each new page has a distinct
search intent and useful content.

### Days 61--90: Measure and refine

-   [ ] Compare query and page performance against baseline.
-   [ ] Prioritize pages ranking around positions 4--15.
-   [ ] Review CTR changes by query, page and device.
-   [ ] Improve pages with impressions but weak relevant clicks.
-   [ ] Review backlinks and local authority.
-   [ ] Report organic enquiries and conversion rate.
-   [ ] Create next-quarter backlog based on evidence.

**Gate:** Report actual outcomes; do not claim ranking success without
Search Console evidence.

------------------------------------------------------------------------

## 10. KPI targets and reporting rules

These are planning targets, not guaranteed results or ranking promises.

  -----------------------------------------------------------------------
  KPI                                  Baseline    90-day planning target
  ------------------- ------------------------- -------------------------
  Clicks / comparable                        84                  150--220
  3-month period                                

  Impressions /                           4,740              6,000--8,000
  comparable 3-month                            
  period                                        

  CTR                                     1.77%                 2.5--3.0%

  Average position                          7.1                      5--6

  Qualified organic          Establish baseline    Increase from baseline
  enquiries                                     
  -----------------------------------------------------------------------

**Measurement requirements:**

-   Compare the same Search Console property and search type.
-   Use comparable date windows and account for seasonality.
-   Segment branded vs non-branded queries.
-   Segment India vs other countries.
-   Segment desktop vs mobile.
-   Review page and query reports separately.
-   Record changes and deployment dates.
-   Do not use average position as the only success measure.
-   Do not treat an increase in impressions as success if irrelevant
    traffic is growing.

------------------------------------------------------------------------

## 11. Final QA / release checklist

A change is ready for production only when all relevant checks pass.

  ---------------------------------------------------------------------------------------
  Test ID        Test case             Expected result      Status         Evidence
  -------------- --------------------- -------------------- -------------- --------------
  QA-01          Production URL        Correct HTTP status  NOT TESTED     
                 returns successfully  and page content.                   

  QA-02          Canonical             Points to intended   NOT TESTED     
                                       canonical URL.                      

  QA-03          Robots/indexability   Page can be indexed  NOT TESTED     
                                       when intended.                      

  QA-04          Title and description Correct, unique and  NOT TESTED     
                                       relevant.                           

  QA-05          H1 and content        Matches page intent  NOT TESTED     
                                       and visible content.                

  QA-06          Internal links        Relevant links work  NOT TESTED     
                                       and are crawlable.                  

  QA-07          Structured data       Valid and matches    NOT TESTED     
                                       visible facts.                      

  QA-08          Mobile visual test    No overflow or       NOT TESTED     
                                       broken layout.                      

  QA-09          Desktop visual test   No broken layout or  NOT TESTED     
                                       interaction.                        

  QA-10          Forms and CTAs        Correct validation,  NOT TESTED     
                                       delivery and                        
                                       tracking.                           

  QA-11          Browser console       No new critical      NOT TESTED     
                                       errors.                             

  QA-12          Performance           No material          NOT TESTED     
                                       regression; metrics                 
                                       recorded.                           

  QA-13          Sitemap               Updated URL appears  NOT TESTED     
                                       if indexable and                    
                                       appropriate.                        

  QA-14          Search Console        Indexing             NOT TESTED     
                 inspection            request/inspection                  
                                       performed where                     
                                       appropriate.                        

  QA-15          Rollback              Previous version can NOT TESTED     
                                       be restored.                        
  ---------------------------------------------------------------------------------------

### Release decision

-   `PASS`: all critical tests pass and evidence is attached.
-   `FAIL`: any critical test fails; fix before release.
-   `BLOCKED`: approval, credentials, facts or required access are
    missing.
-   `NOT TESTED`: no evidence exists yet.

------------------------------------------------------------------------

## 12. AI agent execution report template

The AI agent must append a report after each work session.

``` text
Project: BuzingBee.com
Date:
Environment: Staging / Production
Commit or deployment ID:

Task ID:
Page / URL:
Change made:
Reason:
Files changed:

Tests executed:
1.
2.
3.

Results:
- PASS:
- FAIL:
- BLOCKED:
- NOT TESTED:

Evidence:
- Screenshot:
- URL:
- Test output:
- Search Console annotation/date:

Risks:
Rollback plan:
Next action:
Human approval required: YES / NO
```

## 13. Important owner approvals required

Before implementing the following, ask the business owner:

1.  Which is the primary market: Dhanbad/Jharkhand, Kolkata, pan-India,
    or a combination?
2.  Which services are currently offered and should be promoted?
3.  Which phone number, email and business address/service area are
    official?
4.  Which client projects, testimonials, statistics and certifications
    can be publicly used?
5.  Is there permission to create or update location-specific pages?
6.  Are proposed title and content changes approved?

------------------------------------------------------------------------

## 14. Source files used

The baseline figures in this plan are taken from the supplied Search
Console ZIP export:

-   `Queries.csv`
-   `Pages.csv`
-   `Chart.csv`
-   `Devices.csv`
-   `Countries.csv`
-   `Filters.csv`
-   `Search appearance.csv`

Export filename: `buzingbee.com-Performance-on-Search-2026-11-18.zip`.

The Search Console data supports performance observations only. It does
not prove the cause of low CTR, technical errors, competitor
superiority, backlink quality or website security compromise. Those
items require separate tests and evidence.

------------------------------------------------------------------------

**End of execution plan.**\
**Operating principle: Inspect → Record baseline → Fix → Test → Capture
evidence → PASS/FAIL → Release → Measure.**

------------------------------------------------------------------------

## 15. Execution report: session 1 (2026-11-18)

``` text
Project: BuzingBee.com
Date: 2026-11-18
Environment: Local production build (next build + next start on :3100), compared against live production
Commit or deployment ID: base 1bcda29 (main); changes committed on top, not yet deployed
```

### 15.1 Critical finding (fixed in code, not yet deployed)

Live production still serves 36 indexed URLs: 9 pages and 27 blog posts.
Repository `main` (PR #5, commit 6536553, "single-page experience") had
deleted every route except `/`. The next deploy would have returned 404
for every URL with Search Console impressions. That includes `/blog`,
`/contact`, `/services`, `/portfolio`, `/pricing`, the Dhanbad guide and
the Ads comparison article.

Owner decision (2026-11-18): restore the pages. The 40 deleted files
(pages, components, `lib/caseStudy.ts`, `lib/data.ts`, `lib/seo.ts`) and
the multi-route sitemap generator are restored from `6536553^`. The new
homepage, navbar design and fonts are kept.

### 15.2 Changes made

| Task | Change | Files |
|------|--------|-------|
| T-07 | Restored 9 pages, plus blog and case-study detail routes; all 36 live URLs return 200 locally | `app/**`, `components/**`, `lib/caseStudy.ts`, `lib/data.ts`, `lib/seo.ts` |
| T-07 | Unknown blog and case-study slugs returned 200 (soft 404, confirmed on live). They now return 404 through `notFound()`. API errors now raise a 5xx instead of being reported as "not found" | `app/blog/[slug]/page.tsx`, `app/case-studies/[slug]/page.tsx`, `lib/blog.ts`, `lib/caseStudy.ts` |
| T-07 | Slug fetch is wrapped in React `cache()`. `generateMetadata` and the page shared no request, so each article view hit the API twice and counted twice; it now counts once | `lib/blog.ts`, `lib/caseStudy.ts` |
| T-02 | Sitemap generator restored: 39 URLs (36 live + 3 posts published since) | `scripts/generate-sitemap.mjs`, `public/sitemap.xml` |
| T-09 / L-01 | The restored pages had no internal links (the nav pointed to homepage anchors). Nav and footer now link to `/about`, `/services`, `/portfolio`, `/blog` and `/contact` | `lib/constants.ts` |
| T-13 | 16 of 27 blog posts had 2 or more `<h1>` (one had 9), because CMS content held its own H1s. Content H1s are now demoted to H2, so every page has exactly 1 H1 | `app/blog/[slug]/page.tsx` |
| T-16 | `/og-image.png` returned 404 on live, but metadata and schema pointed to it. Created a 1200×630 image (90 KB) | `public/og-image.png` |
| T-16 | 6 pages (`/about`, `/services`, `/pricing`, `/startup`, `/portfolio`, `/contact`) had no `og:image` because their `openGraph` override replaced the root one. Image added | 6 layout/page files |
| T-19 | Removed the `SearchAction` schema: the site has no search, so the markup described a feature that does not exist | `app/layout.tsx` |
| T-19 | Schema logo and favicons pointed to a 5.8 MB PNG. They now point to `android-chrome-512x512.png`, `favicon.ico` and `apple-touch-icon.png` | `app/layout.tsx`, `app/blog/[slug]/page.tsx` |
| T-26 | The footer loaded the same 5.8 MB PNG at 32 px on every page (9.6 s to download on live). It now uses the 26 KB 192 px icon, with empty alt because it is decorative next to the brand text | `components/Footer.tsx` |
| T-12 | Removed the meta keywords list: 34 terms, including the typo "degital" and an unsupported "best". Google ignores this tag | `app/layout.tsx` |
| — | `llms.txt` now lists the real page URLs | `public/llms.txt` |

No title, meta description or visible copy was changed. Local titles and
descriptions match live exactly on all 36 URLs, so section 5.2 approval
is still required for those changes.

### 15.3 Test results

| ID | Status | Evidence |
|----|--------|----------|
| P0-01 | PASS | Repo `NewBuzingbee`; site in `BuzingBee/` (Next.js 15.5 App Router, `output: standalone`, Docker). Blog and case studies are fetched from `api.buzingbee.com` (Backend/ + AdminPanel/ CMS). Deploy pipeline not found in repo (the nested `deploy.yml` was empty). |
| P0-02 | PASS | As above. |
| P0-03 | PASS | Live HTML and metadata for all 36 sitemap URLs captured (title, description, canonical, robots, H1, OG, JSON-LD types, img alt, word count). Screenshots not taken. |
| P0-04 | BLOCKED | No Search Console or GA4 access. |
| P0-05 | BLOCKED | Owner has not confirmed business facts. Conflict found: `public/schema.json` says Kolkata, WB; content targets Dhanbad/Jharkhand; Organization `areaServed` = "Worldwide". |
| P0-06 | PASS | Git commit `1bcda29` is the restore point. |
| P0-07 / A-09 | BLOCKED | Needs Search Console access. |
| T-01 | PASS | `robots.txt` returns 200. It allows `/`, disallows `/api/` and blocks 5 SEO crawler bots. Sitemap is declared. |
| T-02 | PASS (local) | Local sitemap: 39 valid URLs, all 200. Before the fix, the repo generated `/` only. |
| T-03 | BLOCKED | Needs Search Console. |
| T-04 | PASS | Every URL has an absolute self-canonical (live and local). |
| T-05 | PASS | `index, follow` on all URLs; no `X-Robots-Tag` header. |
| T-06 | FAIL (infra) | `http://www.buzingbee.com/` takes 2 hops (301 to `https://www`, then 308 to `https://`). Fix at the proxy/CDN: redirect `http://www` straight to `https://buzingbee.com`. Not fixable in the repo. |
| T-07 | PASS (local) | 39/39 sitemap URLs 200; unknown blog slug, case-study slug and path all 404. Live: unknown slugs return 200 (soft 404). |
| T-08 | PASS | No chains on the HTTPS host; www gives 1 hop. |
| T-09 | PASS (local) | Homepage links to `/about`, `/services`, `/portfolio`, `/blog` and `/contact`. |
| T-10 | BLOCKED | Needs Search Console. |
| T-11 | FAIL (content) | Titles are unique, but 2 CMS posts have keyword-stuffed titles of over 400 characters (`best-ai-digital-marketing-agency-in-jharkhand-…`, `top-10-best-real-estate-marketing-agencies-in-dhanbad-2026`). The Instagram-outage post title repeats itself. Fix in the Admin Panel SEO fields; needs owner approval. |
| T-12 | FAIL (content) | Homepage description says "leading" (unsupported claim, §4.2). The `best-ai-digital-marketing-agency-in-jharkhand` meta description contains the literal text "Meta Descri…". Owner approval needed. |
| T-13 | PASS (local) | 39/39 pages have exactly one H1 (live: 16 posts had 2 or more). |
| T-14 | NOT TESTED | |
| T-15 | PASS | Every `<img>` has an `alt` attribute (0 missing, live and local). |
| T-16 | PASS (local) | All 39 pages have an `og:image`; `/og-image.png` returns 200. |
| T-17 | PASS | `lang="en"` and a responsive viewport are set. `og:locale` is `en_US`; consider `en_IN` once the India focus is confirmed. |
| T-18 | NOT TESTED | Contextual links from articles to service pages not reviewed. |
| T-19 | PASS (local) | All JSON-LD blocks parse. Organization name, URL and logo are valid; fake SearchAction removed. Contact facts are pending P0-05. |
| T-20 | BLOCKED | Needs a verified address (P0-05). |
| T-21, T-23 | NOT TESTED | |
| T-22 | NOT TESTED | BlogPosting is present on posts; fields not validated against the Rich Results test. |
| T-24 | PASS | No review or rating markup found. |
| T-25 | NOT TESTED | PageSpeed / CrUX not run. |
| T-26 | PASS (partial) | 5.8 MB image removed from every page. Other images not audited. |
| T-28 / QA-11 | PASS | No console errors on `/`, `/services`, `/contact`, `/blog` or the Dhanbad guide (local). |
| T-29 | PASS | At 375 px, no page scrolls horizontally except `/contact`. There the right column's entrance animation (`x: 30`) adds 15 px until it scrolls into view; the body clips it. Low severity. |
| T-30 | PASS | At 1366 px: no overflow and no broken images on 5 key templates. |
| T-31, T-32, M-01–M-08 | NOT TESTED / BLOCKED | Form submission not run, to avoid creating real leads; analytics access missing. |
| C-01–C-08, A-01–A-08 | BLOCKED | Owner approvals in §13 required. |

### 15.4 Risks

- Restoring the pages reverses part of PR #5. Its homepage stays, but the
  nav now leads to inner pages.
- Blog and case-study detail pages now raise errors when the API is down.
  The status is 5xx (temporary) instead of 200 with empty content.
- `next build` regenerates `public/sitemap.xml` from the live API on each
  build.

### 15.5 Rollback plan

Revert the commit that contains this report. The previous state is
`1bcda29`.

### 15.6 Next actions

1. Deploy, then re-run the T-07 crawl against production and resubmit the
   sitemap in Search Console (QA-13/14).
2. Owner answers §13. After that, title and description experiments
   (§5.2) and the CMS title clean-up (T-11/T-12).
3. Fix the `http://www` 2-hop redirect at the proxy/CDN (T-06).
4. Grant Search Console and GA4 access for P0-04, T-03, T-10 and the
   §1.3 query investigation.

Human approval required: YES (deploy, §13 facts, title changes).
