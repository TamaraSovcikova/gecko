type SharedLegalProps = {
  compact?: boolean;
};

const policySectionStyle = {
  marginBottom: "10px",
};

const titleStyle = {
  marginTop: 0,
  marginBottom: "6px",
};

const textStyle = {
  marginTop: 0,
  lineHeight: 1.6,
};

export function DataPolicyContent({ compact = false }: SharedLegalProps) {
  const headerTag = compact ? "h3" : "h2";
  const Header = headerTag as keyof JSX.IntrinsicElements;

  return (
    <>
      <div style={policySectionStyle}>
        <Header style={titleStyle}>What data we collect</Header>
        <p style={textStyle}>
          We collect account metadata such as username and authentication identifiers, payslip
          and budgeting information you enter, expense records you log, and quiz activity where
          quiz features are used. We only aim to collect the data needed to operate the app and
          improve budgeting-related features.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Why we collect it</Header>
        <p style={textStyle}>
          We use this data to authenticate users, calculate payslip and budget views, show spending
          dashboards, support educational and quiz features, and maintain account-management tools
          such as profile updates and deletion.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>How it is stored</Header>
        <p style={textStyle}>
          Authentication is handled through Firebase Auth. Profile metadata, payslip information,
          budgeting records, expenses, and related audit metadata are stored in MongoDB Atlas.
          We aim to keep storage limited to what the application currently needs.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Who can access it</Header>
        <p style={textStyle}>
          Access is intended to be limited to the development team operating this project and,
          where required for project oversight or administration, relevant university staff or admins.
          We do not aim to sell your data or share it with unrelated third parties.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Warning about AI features (Groq)</Header>
        <p style={textStyle}>
          If you use AI assistant features, your prompt content may be sent to Groq and/or other
          AI infrastructure providers used by this project so responses can be generated. Do not
          submit highly sensitive personal, financial, legal, medical, or security information in
          AI chat inputs. Third-party providers may process data under their own terms and privacy
          policies, and retention behavior may differ from our internal systems.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>General third-party API warning</Header>
        <p style={textStyle}>
          Some app functionality depends on third-party APIs and platforms (for example,
          authentication, database, salary/job data, quiz content, and AI features). When data is
          sent to those services as required to provide a feature, it may be processed according to
          each provider's own policies. While we aim to use reputable providers and minimize data
          sharing, we cannot guarantee uninterrupted availability, identical regional controls, or
          error-free processing across external services.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Consent</Header>
        <p style={textStyle}>
          Where registration or onboarding asks for consent, we aim to use that consent as the basis
          for optional processing. If the implementation changes, this policy should be reviewed so the
          wording stays aligned with the actual consent flow shown in the app.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Policy scope warning</Header>
        <p style={textStyle}>
          This data policy is an operational summary of current practices and is not a substitute for
          independent legal advice. We may update this policy as integrations, security controls, or
          legal requirements change. Continued use of the app after updates indicates acceptance of
          the revised policy version.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Your rights</Header>
        <p style={textStyle}>
          You can ask to access, correct, or delete your data. The app already includes account deletion
          functionality, and we aim to keep that flow transparent. Where full GDPR compliance has not yet
          been independently verified, this document is intended as a best-practice draft rather than a
          legal guarantee.
        </p>
      </div>
    </>
  );
}

export function TermsContent({ compact = false }: SharedLegalProps) {
  const headerTag = compact ? "h3" : "h2";
  const Header = headerTag as keyof JSX.IntrinsicElements;

  return (
    <>
      <div style={policySectionStyle}>
        <Header style={titleStyle}>Using the service</Header>
        <p style={textStyle}>
          G.E.C.K.O is a student project that aims to help users understand payslips,
          manage budgets, and review spending habits. You agree to use the app lawfully and not
          to misuse the service, interfere with other users, or attempt to access data that is
          not yours.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Account responsibilities</Header>
        <p style={textStyle}>
          You are responsible for the accuracy of the information you enter, including payslip,
          budgeting, and expense data. You are also responsible for maintaining access to your
          sign-in provider, including Firebase email/password or Google sign-in where applicable.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Third-party services</Header>
        <p style={textStyle}>
          Some features rely on third-party services such as Firebase Auth for authentication,
          MongoDB Atlas for data storage, Adzuna for salary and job-market information, and quiz
          providers such as QuizApi where quiz features are enabled, plus Groq or similar providers
          for AI-assisted features. We aim to present third-party results accurately, but we cannot
          guarantee those external services are always available, error-free, or suitable for every
          purpose.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>API and AI usage notice</Header>
        <p style={textStyle}>
          By using features powered by external APIs, you authorize us to transmit the minimum data
          needed to process your request. For AI-assisted features, do not submit confidential or
          highly sensitive information. External providers may apply their own retention,
          moderation, and regional processing rules.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Service availability</Header>
        <p style={textStyle}>
          This project is provided on a best-effort basis. We aim to keep the service available,
          but downtime, incomplete features, or data inconsistencies may occur while the project
          is under active development and review.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>User content and accuracy</Header>
        <p style={textStyle}>
          You retain ownership of the information you submit, but you are responsible for ensuring
          it is lawful and accurate. Calculations, forecasts, and AI outputs may contain errors and
          should be independently verified before making financial or legal decisions.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Acceptable use</Header>
        <p style={textStyle}>
          You must not upload malicious content, abuse the API, try to bypass authentication,
          or use the platform in a way that could disrupt service operation or compromise privacy.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Suspension and termination</Header>
        <p style={textStyle}>
          We may restrict or suspend access where we reasonably believe there is misuse, security
          risk, policy violation, or legal necessity. Where possible, we aim to provide context,
          but immediate action may be required to protect users or service integrity.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Limitation of liability</Header>
        <p style={textStyle}>
          To the maximum extent permitted by applicable law, this student project and its
          contributors are not liable for indirect, incidental, or consequential losses arising from
          use of the app, third-party API failures, inaccurate outputs, or temporary unavailability.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Changes to these terms</Header>
        <p style={textStyle}>
          We may update these Terms & Conditions to reflect feature updates, API integrations,
          security improvements, or legal requirements. Continued use of the service after updates
          indicates acceptance of the revised terms.
        </p>
      </div>

      <div style={policySectionStyle}>
        <Header style={titleStyle}>Disclaimer</Header>
        <p style={textStyle}>
          G.E.C.K.O is not financial, tax, legal, or employment advice. It is intended
          as an educational budgeting tool, and you should verify important decisions using trusted
          official sources.
        </p>
      </div>
    </>
  );
}
