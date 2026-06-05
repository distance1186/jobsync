import { getContacts } from "@/actions/contact.actions";
import ContactsPageClient from "./ContactsPageClient";

async function ContactsPage() {
  const result = await getContacts();
  return <ContactsPageClient contacts={result?.data ?? []} />;
}

export default ContactsPage;
