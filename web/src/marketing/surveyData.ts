// The two market-research surveys. Wording comes from the Tsela Assist survey briefs; edit here to change the page.

export type Question = {
  id: string
  section: string
  text: string
  hint?: string
  type: 'long' | 'single' | 'multi'
  options?: string[] // an option called exactly "Other" reveals a text box
}

export type Survey = {
  slug: 'merchants' | 'customers'
  kicker: string
  title: string
  tagline: string
  audience: string
  intro: string[]
  minutes: number
  questions: Question[]
  thanks: string
  note: string
}

export const surveys: Survey[] = [
  {
    slug: 'merchants',
    kicker: 'For service providers',
    title: 'Merchant Pilot Interest Survey',
    tagline: 'Help us build a reliable roadside assistance network.',
    audience: 'Mechanics, tyre fitters, towing and roadside service businesses',
    intro: [
      'Tsela Assist is developing a digital platform that connects motorists and fleet operators with service providers for roadside assistance, vehicle breakdowns and emergency support.',
      'We are engaging service providers to understand their business needs and assess their interest in participating in our pilot programme.',
    ],
    minutes: 3,
    questions: [
      {
        id: 'services_and_areas',
        section: 'Section A: Business profile',
        text: 'What type of services does your business offer, and which geographical areas do you cover?',
        type: 'long',
      },
      {
        id: 'how_customers_find_you',
        section: 'Section B: Business opportunities',
        text: 'How do you currently attract customers and receive service requests?',
        type: 'long',
      },
      {
        id: 'platform_interest',
        section: 'Section C: Interest in the platform',
        text: 'Would you be interested in receiving additional customer enquiries and breakdown service requests through a digital platform like Tsela Assist?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe – I would like more information'],
      },
      {
        id: 'emergency_availability',
        section: 'Section D: Service availability',
        text: 'Are you able to provide emergency assistance, including after-hours, weekends and in remote locations?',
        type: 'single',
        options: ['Yes, 24/7', 'Yes, during selected hours', 'Weekdays only', 'No emergency services currently'],
      },
      {
        id: 'pilot_participation',
        section: 'Section E: Pilot participation',
        text: 'Would you be willing to participate in the Tsela Assist pilot programme, receive job requests through the platform and operate under an agreed commission or service-fee arrangement?',
        type: 'single',
        options: ['Yes, I am interested', 'Yes, subject to further discussion', 'Maybe – I need more information', 'No'],
      },
    ],
    thanks:
      'Thank you for your interest in Tsela Assist. Your feedback will help us develop a reliable network of service providers.',
    note: 'Participation in this survey does not constitute formal merchant registration or a contractual commitment.',
  },
  {
    slug: 'customers',
    kicker: 'For motorists and fleets',
    title: 'Customer & Fleet Operator Market Research Survey',
    tagline: 'Your feedback can help us improve roadside assistance and reduce vehicle downtime.',
    audience: 'Motorists, truck drivers, transport companies, fleet managers and operators',
    intro: [
      'Tsela Assist is developing a digital platform designed to connect motorists, drivers and fleet operators with reliable roadside assistance and vehicle service providers.',
      'We would like to understand your experiences, challenges and interest in using such a platform.',
    ],
    minutes: 3,
    questions: [
      {
        id: 'customer_category',
        section: 'Section A: Customer profile',
        text: 'Which category best describes you?',
        type: 'single',
        options: [
          'Individual motorist',
          'Truck driver',
          'Logistics or transport company',
          'Fleet manager',
          'Mine or industrial operation',
          'Municipality or government fleet',
          'Other',
        ],
      },
      {
        id: 'current_assistance',
        section: 'Section B: Current challenges',
        text: 'How do you currently access assistance when a vehicle tyre breakdowns occur midnight, early mornings and afternoons on highways and remote areas?',
        type: 'single',
        options: [
          'Contact a known mechanic or service provider',
          'Contact our internal maintenance team',
          'Search online or on Google',
          'Contact insurance or roadside assistance',
          'Ask for referrals',
          'Other',
        ],
      },
      {
        id: 'biggest_challenge',
        section: 'Section C: Breakdown experiences',
        text: 'What is your biggest challenge when dealing with vehicle breakdowns, particularly on highways, in remote areas or after hours?',
        type: 'single',
        options: [
          'Difficulty finding available service providers',
          'Long response and waiting times',
          'Unreliable service providers',
          'High service costs',
          'Driver safety concerns',
          'Lack of communication and updates',
          'Other',
        ],
      },
      {
        id: 'platform_interest',
        section: 'Section D: Platform interest',
        text: 'Would you use a digital platform like Tsela Assist to locate and request assistance from available service providers near your breakdown location?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe – depending on the services offered'],
      },
      {
        id: 'valuable_features',
        section: 'Section E: Preferred features',
        text: 'Which features would be most valuable to you when using a roadside assistance platform?',
        hint: 'Select all that apply.',
        type: 'multi',
        options: [
          'Finding nearby, verified service providers',
          'Access to emergency assistance, including after-hours',
          'Real-time service provider location and estimated arrival time',
          'Upfront quotations and transparent pricing',
          'Digital payment options',
          'Breakdown tracking and service updates',
          'Digital reports and service history',
          'Driver safety and emergency support',
        ],
      },
    ],
    thanks:
      'Thank you for participating in the Tsela Assist market research survey. Your feedback will help shape a platform that prioritises accessibility, reliability, driver safety and reduced vehicle downtime.',
    note: 'Participation does not constitute a commitment to purchase or subscribe to Tsela Assist.',
  },
]

export const surveyBySlug = (slug: string | undefined) => surveys.find((s) => s.slug === slug)
