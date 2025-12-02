# TaskEval AI - Smart Code Evaluation Platform

TaskEval AI is a full-stack Next.js application that leverages Artificial Intelligence to provide instant, detailed feedback on coding tasks. It features a robust evaluation engine, premium user tiers, and secure payment processing.

## 🚀 Features

-   **AI-Powered Evaluation**: Automatically analyzes code submissions for correctness, style, and efficiency using advanced LLMs.
-   **Instant Feedback**: Provides immediate scores, strength analysis, and areas for improvement.
-   **Premium Reports**: Detailed, in-depth analysis reports available for premium subscribers.
-   **Secure Payments**: Integrated Stripe payment processing for one-time report unlocks or premium subscriptions.
-   **Dashboard**: Comprehensive user dashboard to track submissions and progress.
-   **Authentication**: Secure user authentication and session management via Supabase.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS, Shadcn UI
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **AI Integration**: OpenAI / Ollama
-   **Payments**: Stripe
-   **Deployment**: Vercel

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Backend API endpoints (evaluation, payments, etc.)
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   └── task/             # Task submission and detail views
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── forms/            # Form components
│   ├── payment/          # Payment processing components
│   ├── tasks/            # Task display and interaction components
│   └── ui/               # Reusable UI components (Shadcn)
├── lib/                  # Utility functions and shared logic
│   ├── ai/               # AI service integrations
│   ├── supabase/         # Supabase client and server utilities
│   └── utils.ts          # General helper functions
└── public/               # Static assets
```

## ⚡️ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/task-eval-ai.git
    cd task-eval-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    STRIPE_SECRET_KEY=your_stripe_secret_key
    OPENAI_API_KEY=your_openai_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 📝 License

This project is licensed under the MIT License.
