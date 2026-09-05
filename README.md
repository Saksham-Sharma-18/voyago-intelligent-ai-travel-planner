# 🌍 Voyago — AI-Powered Personalized Travel Planner

> **Plan smarter. Travel better.**

Voyago is a full-stack, AI-powered travel planning application built with **Next.js, TypeScript, Zustand, and Google's Gemini AI**.

It guides users through a complete travel-planning journey — from defining their preferences and discovering destinations to generating itineraries, optimizing costs, assessing safety, and completing the booking flow.

Unlike a traditional travel planner, Voyago combines **generative AI with custom personalization, optimization, cost-management, and geopolitical risk engines** to create travel plans tailored to each user.

---

## ✨ Features

### 🧭 Guided 9-Step Travel Planning

Voyago provides a structured travel-planning experience through a multi-step wizard:

1. **Welcome** — Introduction to the travel planning experience
2. **Requirements** — Collects destination preferences, budget, interests, group size, and other requirements
3. **Recommendations** — Generates personalized AI-ranked destination recommendations
4. **Itinerary** — Builds a day-by-day travel itinerary
5. **Costs** — Provides a detailed breakdown of estimated trip expenses
6. **Safety** — Evaluates destination safety and travel risks
7. **Report** — Generates a comprehensive trip report
8. **Booking** — Provides hotel selection and booking/payment flow
9. **Confirmation** — Displays the final booking confirmation

---

# 🤖 AI & Intelligence Architecture

Voyago combines generative AI with five custom intelligence modules.

## 🧠 1. AI Recommendation Engine — AI Engine

The AI Recommendation Engine uses **Gemini AI** to generate personalized destination recommendations based on user requirements.

### It considers:

* Travel purpose
* Budget
* Interests
* Group size
* Special requirements

The engine generates structured destination objects and ranks recommendations according to the user's preferences.

A **mock scoring engine** is also available as a fallback when the Gemini service is unavailable.

**Core file:** `src/lib/ai-engine.ts`

---

## 👤 2. Behavioral Personalization Layer — BPL

The Behavioral Personalization Layer analyzes user micro-interactions during the planning process.

It tracks signals such as:

* Hover interactions
* Destination selections
* Interest toggles
* Budget slider interactions
* Other preference-related actions

Based on these signals, Voyago dynamically calculates a user archetype.

### Personalization axes

* `riskSeeker`
* `luxuryOriented`
* `socialTraveler`
* `culturalDepth`

The system maintains recent behavioral signals and continuously updates the user's inferred travel profile.

**Core file:** `src/lib/behavior-tracker.ts`

---

## 📅 3. Adaptive Itinerary Re-Optimizer — AIRO

AIRO dynamically optimizes travel itineraries according to configurable constraints.

### Constraints include:

* Maximum hours per day
* Maximum entry fees
* Maximum fatigue score
* Crowd avoidance

The engine can:

* Detect constraint violations
* Report time, budget, and fatigue overflows
* Reorder attractions
* Optimize attractions using value/time efficiency

**Core file:** `src/lib/airo-engine.ts`

---

## 💰 4. Smart Cost Optimizer — SCO

The Smart Cost Optimizer generates multiple versions of a trip based on different spending strategies.

### 🏆 Best Value

Maximizes the quality of the experience relative to the budget.

### ✨ Dream Plan

Provides a premium/luxury-oriented travel experience.

### 🛡️ Safe Plan

Uses a conservative budget strategy with additional financial buffer.

Each plan includes metrics such as:

* Efficiency score
* Budget utilization
* Quality score
* Savings compared with the Dream Plan

**Core file:** `src/lib/sco-engine.ts`

---

## 🌐 5. Geopolitical Risk Recalibration — GRR

The Geopolitical Risk Recalibration engine adjusts destination recommendations according to risk factors and the user's risk tolerance.

It applies configurable geopolitical multipliers:

* `0.55`
* `0.82`
* `1.0`

The system considers the user's risk tolerance on a **1–5 scale** and recalculates destination scores accordingly.

### Risk advisories

Voyago can generate:

* ℹ️ **Info**
* ⚠️ **Warning**
* 🚨 **Critical**

If a destination's score drops significantly after risk recalibration, the system can trigger a corresponding advisory and re-rank recommendations.

**Core file:** `src/lib/grr-engine.ts`

---

# 🏗️ Tech Stack

| Category            | Technology              |
| ------------------- | ----------------------- |
| Framework           | Next.js 16.2            |
| Architecture        | App Router              |
| Build / Development | Turbopack               |
| Language            | TypeScript              |
| State Management    | Zustand                 |
| AI                  | Google Gemini 2.0 Flash |
| AI Integration      | Next.js API Route       |
| Destination Photos  | Pexels API              |
| Photo Fallback      | Unsplash                |
| Styling             | Tailwind CSS            |
| UI Components       | shadcn/ui               |

---

# 🏛️ Application Architecture

Voyago follows a modular architecture in which the central application state coordinates multiple intelligence engines.

```text
                         ┌──────────────────────┐
                         │      User Input      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Requirements Step   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │     Zustand Global Store     │
                    └──────────────┬───────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
      │ AI Engine   │      │     BPL     │      │     GRR     │
      │             │      │ Behavioral  │      │ Geopolitical│
      │ Gemini AI   │      │ Personalize │      │ Risk        │
      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │  Recommendations    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       AIRO          │
                         │ Itinerary Optimizer │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       SCO           │
                         │ Cost Optimization   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Trip Report /       │
                         │ Booking / Confirm.  │
                         └─────────────────────┘
```

---

# 📁 Project Structure

Important project files include:

```text
src/
├── app/
│   ├── page.tsx
│   └── api/
│       └── ai-recommend/
│
├── lib/
│   ├── ai-engine.ts
│   ├── behavior-tracker.ts
│   ├── airo-engine.ts
│   ├── sco-engine.ts
│   ├── grr-engine.ts
│   ├── store.ts
│   ├── types.ts
│   ├── destinations-data.ts
│   └── trip-utils.ts
│
└── components/
    └── ...
```

### Key files

| File                   | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `store.ts`             | Central Zustand store coordinating application state and intelligence modules |
| `types.ts`             | TypeScript interfaces and data structures                                     |
| `ai-engine.ts`         | AI destination recommendation engine                                          |
| `behavior-tracker.ts`  | Behavioral personalization and user archetype calculation                     |
| `airo-engine.ts`       | Adaptive itinerary optimization                                               |
| `sco-engine.ts`        | Smart cost optimization                                                       |
| `grr-engine.ts`        | Geopolitical risk recalibration                                               |
| `destinations-data.ts` | Static destination database used for fallback recommendations                 |
| `trip-utils.ts`        | Itinerary generation and cost calculation utilities                           |
| `page.tsx`             | Main application entry point and step-based wizard                            |

---

# 🔄 User Journey

```text
Welcome
   ↓
Requirements
   ↓
AI Recommendations
   ↓
Itinerary
   ↓
Cost Optimization
   ↓
Safety Assessment
   ↓
Trip Report
   ↓
Booking
   ↓
Confirmation
```

The result is a complete travel-planning workflow rather than a simple destination recommendation system.

---

# 🧠 What Makes Voyago Different?

Traditional travel applications often treat destination discovery, itinerary planning, budgeting, and safety as separate features.

Voyago connects these components into a single intelligent planning pipeline.

### Voyago combines:

**Generative AI**
→ Personalized destination discovery

**Behavioral intelligence**
→ Understands how users interact with the application

**Itinerary optimization**
→ Balances time, fatigue, cost, and attractions

**Cost optimization**
→ Produces different financial strategies

**Risk recalibration**
→ Adjusts recommendations based on geopolitical risk and user tolerance

Together, these systems create a **personalized, optimized, and risk-aware travel planning experience**.

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have:

* Node.js installed
* npm / another Node.js package manager
* A Gemini API key
* A Pexels API key (if required by the photo integration)

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env.local` file in the project root and add the required API credentials.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
PEXELS_API_KEY=your_pexels_api_key
```


---

## Run the Development Server

```bash
npm run dev
```

Then open the application in your browser at:

```text
http://localhost:3000
```

# 🚀 Future Improvements

Potential future improvements include:

* Real-time flight and hotel integrations
* Live travel pricing
* Real payment gateway integration
* Real-time geopolitical and travel advisory APIs
* User accounts and saved trips
* Cloud-based trip history
* Multi-destination trip planning
* Collaborative trip planning
* Calendar integration
* Weather-aware itinerary optimization
* Real-time itinerary adjustment during a trip
* Mobile application
* Advanced recommendation analytics

---

# 👥 Contributors

**Voyago Development Team**

* SAKSHAM SHARMA
* MEGHNA SINGH

---

# 📄 License

This project is currently intended for educational and portfolio purposes.

A formal open-source license can be added if the project is intended for public reuse.

---

# ⭐ Project Summary

**Voyago** is an AI-driven travel planning platform that combines **generative AI, behavioral personalization, itinerary optimization, cost optimization, and geopolitical risk assessment** into one unified travel-planning experience.

> **From preferences to plans — Voyago helps travelers plan smarter.**
