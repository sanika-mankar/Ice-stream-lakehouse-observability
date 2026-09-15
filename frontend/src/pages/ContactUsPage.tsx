import { useState } from "react";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(
          data.message || "Message delivered to Sant7124@gmail.com and sanikamankar74@gmail.com!"
        );
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });

        setTimeout(() => {
          setSuccessMessage(null);
        }, 8000);
      } else {
        setErrorMessage(
          data.message || "Unable to send email. Please check your backend SMTP credentials in .env."
        );
      }
    } catch (error) {
      console.error("Contact Form Error:", error);
      setErrorMessage(
        "Network connection error: Unable to communicate with FastAPI backend on port 8000."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
            Support & Direct Communication
          </p>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Contact Us
          </h1>

          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Have a question, operational feedback, or need lakehouse platform assistance?
            Submissions are automatically routed simultaneously to our primary engineers.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-5">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-primary" />
              </div>

              <h2 className="font-semibold text-base mb-1">
                Direct Team Access
              </h2>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Messages submitted through this portal are dispatched concurrently to both lead engineer mailboxes via SMTP SSL.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">
                Primary Recipients
              </h3>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Primary Lead
                    </p>
                    <p className="text-xs font-mono text-foreground select-all">
                      Sant7124@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Engineering Co-Lead
                    </p>
                    <p className="text-xs font-mono text-foreground select-all">
                      sanikamankar74@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-border/60">
                  <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Response SLA
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Typically within 24 Hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
            {successMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-500/40 bg-green-500/10 p-4 animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                    Dispatched Successfully
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-600 dark:text-red-400">
                    Email Delivery Notice
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold mb-5">
              Send an Operational Inquiry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-foreground">
                  Your Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-foreground">
                  Your Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-foreground">
                  Inquiry Subject
                </label>
                <div className="relative mt-1.5">
                  <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is your inquiry regarding?"
                    required
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-foreground">
                  Detailed Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your question, issue, or feedback..."
                  required
                  rows={4}
                  className="w-full mt-1.5 rounded-lg border border-border bg-background p-3 text-xs outline-none resize-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching via SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to Both Emails</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}