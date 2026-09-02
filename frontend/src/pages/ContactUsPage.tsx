import { useState } from "react";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle,
} from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

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

  try {
    const response = await fetch("http://127.0.0.1:8000/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setSubmitted(true);

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSubmitted(false);
      }, 4000);
    } else {
      alert("Failed to send message. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Unable to connect to the server.");
  }
};

  return (
    <div className="min-h-full bg-background text-foreground p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            SUPPORT & COMMUNICATION
          </p>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Contact Us
          </h1>

          <p className="text-muted-foreground mt-3 max-w-2xl">
            Have a question, feedback, or need assistance? Send us a message
            and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-5">

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-primary" />
              </div>

              <h2 className="font-semibold text-lg mb-2">
                Get in Touch
              </h2>

              <p className="text-sm text-muted-foreground leading-6">
                We're here to help you with questions, technical support,
                feedback, and general inquiries.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">
                Support Information
              </h3>

              <div className="space-y-4">

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email
                    </p>

                    <p className="text-sm font-medium">
                      support@icestream.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Response Time
                    </p>

                    <p className="text-sm font-medium">
                      Within 24 Hours
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 md:p-8">

            {submitted && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <CheckCircle className="w-5 h-5 text-green-400" />

                <div>
                  <p className="font-medium">
                    Message received successfully!
                  </p>

                  <p className="text-sm text-muted-foreground">
                    We will get back to you soon.
                  </p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-6">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="text-sm font-medium">
                  Full Name
                </label>

                <div className="relative mt-2">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-lg border border-border bg-background px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">
                  Email Address
                </label>

                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-lg border border-border bg-background px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium">
                  Subject
                </label>

                <div className="relative mt-2">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is your message about?"
                    required
                    className="w-full rounded-lg border border-border bg-background px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium">
                  Message
                </label>

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  required
                  rows={5}
                  className="w-full mt-2 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
}