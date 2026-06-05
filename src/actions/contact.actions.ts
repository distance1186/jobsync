"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";

export const getContacts = async (): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const data = await prisma.contact.findMany({
      where: { createdBy: user.id },
      include: {
        Interview: {
          include: {
            job: {
              select: {
                id: true,
                JobTitle: { select: { label: true } },
                Company: { select: { label: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data, success: true };
  } catch (error) {
    return handleError(error, "Failed to get contacts.");
  }
};

export const createContact = async (data: {
  name: string;
  email: string;
}): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        createdAt: new Date(),
        createdBy: user.id,
      },
    });

    return { data: contact, success: true };
  } catch (error) {
    return handleError(error, "Failed to create contact.");
  }
};

export const updateContact = async (
  id: string,
  data: { name: string; email: string }
): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const contact = await prisma.contact.update({
      where: { id, createdBy: user.id },
      data: { name: data.name, email: data.email },
    });

    return { data: contact, success: true };
  } catch (error) {
    return handleError(error, "Failed to update contact.");
  }
};

export const deleteContact = async (id: string): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    await prisma.contact.delete({
      where: { id, createdBy: user.id },
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete contact.");
  }
};
