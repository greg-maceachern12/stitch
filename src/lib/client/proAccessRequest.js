const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";

function getAccessKey() {
  return process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY?.trim() || "";
}

function web3formsErrorMessage(data) {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.body?.message === "string") return data.body.message;
  return "Failed to send access request";
}

export async function requestProAccess({ email }) {
  const accessKey = getAccessKey();
  if (!accessKey) {
    throw new Error("Pro access requests are not configured");
  }

  const normalizedEmail = email?.trim();
  if (!normalizedEmail) {
    throw new Error("Please enter your email address");
  }

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : undefined;
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : undefined;

  const message = [
    "Someone requested early access to Visuai Pro.",
    "",
    `Email: ${normalizedEmail}`,
    pageUrl ? `Page: ${pageUrl}` : null,
    userAgent ? `User agent: ${userAgent}` : null,
    `Time: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(WEB3FORMS_SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      email: normalizedEmail,
      subject: "Visuai Pro — access request",
      from_name: "Visuai Pro waitlist",
      message,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(web3formsErrorMessage(data));
  }

  return { success: true };
}
