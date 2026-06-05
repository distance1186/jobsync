"use client";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createContact, updateContact, deleteContact } from "@/actions/contact.actions";

interface Contact {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  interviewId?: string | null;
}

interface ContactsPageClientProps {
  contacts: Contact[];
}

export default function ContactsPageClient({
  contacts: initial,
}: ContactsPageClientProps) {
  const [contacts, setContacts] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditingContact(null);
    setName("");
    setEmail("");
    setDialogOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setEmail(contact.email);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name || !email) {
      toast({ variant: "destructive", title: "Name and email are required" });
      return;
    }
    startTransition(async () => {
      if (editingContact) {
        const result = await updateContact(editingContact.id, { name, email });
        if (result?.success) {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === editingContact.id ? { ...c, name, email } : c
            )
          );
          toast({ description: "Contact updated" });
          setDialogOpen(false);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result?.message ?? "Failed to update contact",
          });
        }
      } else {
        const result = await createContact({ name, email });
        if (result?.success) {
          setContacts((prev) => [result.data, ...prev]);
          toast({ description: "Contact created successfully" });
          setDialogOpen(false);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result?.message ?? "Failed to create contact",
          });
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteContact(id);
      if (result?.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        toast({ description: "Contact deleted" });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message ?? "Failed to delete contact",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <CardTitle>Contacts</CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={openCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Contact
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No contacts yet. Add a recruiter or interviewer to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    {format(new Date(contact.createdAt), "PP")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "New Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
