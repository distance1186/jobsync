"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";

export const getInterviews = async (): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const data = await prisma.interview.findMany({
      where: {
        job: { userId: user.id },
      },
      include: {
        job: {
          select: {
            id: true,
            JobTitle: { select: { label: true } },
            Company: { select: { label: true } },
          },
        },
        interviewers: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data, success: true };
  } catch (error) {
    return handleError(error, "Failed to get interviews.");
  }
};

export const createInterview = async (data: {
  jobId: string;
  createdAt: Date;
}): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const job = await prisma.job.findUnique({
      where: { id: data.jobId, userId: user.id },
    });
    if (!job) throw new Error("Job not found or access denied");

    const interview = await prisma.interview.create({
      data: {
        jobId: data.jobId,
        createdAt: data.createdAt,
      },
    });

    return { data: interview, success: true };
  } catch (error) {
    return handleError(error, "Failed to create interview.");
  }
};

export const deleteInterview = async (id: string): Promise<any> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    await prisma.interview.delete({
      where: { id, job: { userId: user.id } },
    });

    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete interview.");
  }
};
