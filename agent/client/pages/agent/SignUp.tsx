import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { agentApi } from "@/lib/agentApi";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

type OtpForm = { code: string };

export default function AgentSignUp() {
  const { toast } = useToast();
  const [emailSentTo, setEmailSentTo] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });
  const otpForm = useForm<OtpForm>({ defaultValues: { code: "" } });
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  const sendOtp = async (values: FormValues) => {
    try {
      setSending(true);
      const res = await agentApi.requestOtp(
        values.email,
        values.firstName,
        values.lastName,
      );
      setEmailSentTo(values.email);
      toast({ title: "OTP generated", description: `Use code: ${res.code}` });
    } catch (e: any) {
      toast({
        title: "Failed to get OTP",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (values: OtpForm) => {
    if (!emailSentTo) return;
    try {
      setVerifying(true);
      await agentApi.verifyOtp(emailSentTo, values.code);
      window.location.href = "/agent/dashboard";
    } catch (e: any) {
      toast({
        title: "Invalid code",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Agent Sign Up</CardTitle>
          <CardDescription>Create your agent account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!emailSentTo ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(sendOtp)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    name="firstName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="lastName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending…" : "Create Account & Send Code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/agent/login")}
                >
                  Already have an account? Log in
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(verifyOtp)}
                className="space-y-4"
              >
                <div className="text-sm text-muted-foreground">
                  We sent a 6-digit code to {emailSentTo}.
                </div>
                <FormField
                  name="code"
                  control={otpForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter code</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={verifying}>
                  {verifying ? "Verifying…" : "Verify & Continue"}
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setEmailSentTo(null)}
                  >
                    Use a different email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = "/agent/login")}
                  >
                    Already have an account? Log in
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
