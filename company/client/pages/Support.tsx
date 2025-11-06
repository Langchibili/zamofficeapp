import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

function ContactCard({
  title,
  phone,
  email,
  whatsapp,
}: {
  title: string;
  phone: string;
  email: string;
  whatsapp: string;
}) {
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
  return (
    <motion.div variants={item}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <a href={`tel:${phone}`}>
            <Button variant="success" className="w-full">
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
          </a>
          <a href={`mailto:${email}`}>
            <Button variant="info" className="w-full">
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Support() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="container py-8 grid gap-6 md:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
        >
          <ContactCard
            title="Contact Agent"
            phone="+260971000000"
            email="agent@zamoffice.co"
            whatsapp="260971000000"
          />
        </motion.div>
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
        >
          <ContactCard
            title="Contact Zamoffice Support"
            phone="+260211000000"
            email="support@zamoffice.co"
            whatsapp="260211000000"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
