/**
 * POST /api/work-orders/[workOrderId]/upload-requests  →  create upload request + send email
 * GET  /api/work-orders/[workOrderId]/upload-requests  →  list upload requests
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import {
  createRequest,
  listRequestsByWorkOrder,
} from '@/lib/supabase/repos/workOrderUploadRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const ctx = await getRequestContext(req);
    const workOrderId = req.query.workOrderId as string;

    if (!workOrderId) {
      return res.status(400).json({ error: 'Work order ID is required.' });
    }

    // ── POST: create request + email ────────────────────────────────────
    if (req.method === 'POST') {
      const {
        vendorId,
        requestEmail,
        allowedDocTypes,
        expiresInHours,
        maxFiles,
        maxTotalBytes,
        message,
      } = req.body ?? {};

      if (!vendorId || !requestEmail) {
        return res
          .status(400)
          .json({ error: 'vendorId and requestEmail are required.' });
      }

      const result = await createRequest(ctx.orgId, ctx.userId, {
        workOrderId,
        vendorId,
        requestEmail,
        allowedDocTypes,
        expiresInHours,
        maxFiles,
        maxTotalBytes,
        message,
      });

      // Attempt to send email (best-effort)
      try {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          const { Resend } = await import('resend');
          const resend = new Resend(apiKey);
          const appName = 'Vendor Platform';

          await resend.emails.send({
            from: `${appName} <no-reply@${process.env.RESEND_DOMAIN ?? 'example.com'}>`,
            to: requestEmail,
            subject: `Document Upload Request — ${appName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Document Upload Request</h2>
                <p>You have been asked to upload documents. Please use the link below to submit your files.</p>
                ${message ? `<p style="background: #f5f5f5; padding: 12px; border-radius: 8px;"><em>"${message}"</em></p>` : ''}
                <p><strong>Allowed types:</strong> ${(allowedDocTypes ?? ['invoice', 'quote', 'supporting']).join(', ')}</p>
                <p><strong>Link expires:</strong> ${new Date(result.expiresAt).toLocaleString()}</p>
                <a href="${result.portalUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                  Upload Documents
                </a>
                <p style="color: #666; font-size: 13px;">If the button above doesn't work, copy and paste this URL into your browser:<br/>
                <a href="${result.portalUrl}">${result.portalUrl}</a></p>
              </div>
            `,
          });
        } else {
          console.warn(
            '[upload-requests] RESEND_API_KEY not set — email not sent'
          );
        }
      } catch (emailErr: any) {
        console.error(
          '[upload-requests] Email send failed:',
          emailErr?.message
        );
        // Don't fail the request — the link was still created
      }

      return res.status(201).json({
        requestId: result.requestId,
        portalUrl: result.portalUrl,
        expiresAt: result.expiresAt,
      });
    }

    // ── GET: list requests ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const data = await listRequestsByWorkOrder(ctx.orgId, workOrderId);
      return res.status(200).json({ data });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (err: any) {
    console.error('[upload-requests]', err?.message);
    const status = err?.message?.includes('Unauthorized') ? 401 : 500;
    return res.status(status).json({ error: err?.message ?? 'Server error' });
  }
}
