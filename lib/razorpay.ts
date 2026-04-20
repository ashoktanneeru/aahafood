import "server-only";

import crypto from "crypto";

import Razorpay from "razorpay";

function getServerKeyId() {
  return (
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    null
  );
}

function getServerKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

export function getRazorpayPublicKeyId() {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    process.env.RAZORPAY_KEY_ID?.trim() ||
    null
  );
}

export function isRazorpayConfigured() {
  return Boolean(getServerKeyId() && getServerKeySecret());
}

export function createRazorpayClient() {
  const keyId = getServerKeyId();
  const keySecret = getServerKeySecret();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const keySecret = getServerKeySecret();

  if (!keySecret) {
    throw new Error("Razorpay secret is not configured.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const expected = Buffer.from(generatedSignature, "utf8");
  const received = Buffer.from(input.signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

