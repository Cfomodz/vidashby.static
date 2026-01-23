# Consult Intake to CRM Processing

This file documents a minimal intake endpoint that accepts the per-step payload
from consult.html and upserts it into a CRM. The form sends data after each step,
so the backend should handle partial updates without failing.

## Expected POST payload (sent after each step)

```json
{
  "sessionId": "2c90f84c-5d2a-4ff5-9c2f-7e52f4d43f38",
  "stepId": "automation_goal",
  "timestamp": "2026-01-23T18:04:22.000Z",
  "data": {
    "full_name": "Jane Doe",
    "email": "jane@company.com",
    "company": "Acme Co",
    "role": "Operations Lead",
    "automation_goal": "Onboarding and invoice reminders",
    "current_stack": ["n8n", "HubSpot", "Slack"],
    "volume": "1,000 to 10,000",
    "timeline": "This month",
    "budget": "$1k to $5k",
    "followup": "Email",
    "phone": ""
  },
  "source": "consult.html"
}
```

## Processing flow

1. Verify request authenticity (shared secret or signature).
2. Persist the raw payload for audit and retries.
3. Upsert contact by email (or by sessionId until email exists).
4. Upsert company or account by name or domain.
5. Create or update a deal/opportunity when required fields exist.
6. Append notes for free-text fields like automation_goal and notes.

## Example Node 18 handler (no dependencies)

```js
import http from "http";
import { createHmac } from "crypto";

const PORT = process.env.PORT || 3000;
const CRM_BASE_URL = process.env.CRM_BASE_URL; // e.g. https://api.your-crm.com
const CRM_TOKEN = process.env.CRM_TOKEN;
const SHARED_SECRET = process.env.INTAKE_SHARED_SECRET;

function verifySignature(rawBody, signature) {
  if (!SHARED_SECRET || !signature) return true;
  const expected = createHmac("sha256", SHARED_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
}

function mapContact(data) {
  const { firstName, lastName } = splitName(data.full_name);
  return {
    firstName,
    lastName,
    email: data.email,
    phone: data.phone || "",
    role: data.role || "",
    company: data.company || ""
  };
}

function mapDeal(data) {
  return {
    name: `${data.company || "New"} - Automation Consult`,
    budget: data.budget || "",
    timeline: data.timeline || "",
    volume: data.volume || "",
    tools: (data.current_stack || []).join(", "),
    summary: data.automation_goal || ""
  };
}

async function upsertContact(contact) {
  return fetch(`${CRM_BASE_URL}/contacts/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRM_TOKEN}`
    },
    body: JSON.stringify(contact)
  });
}

async function upsertDeal(deal) {
  return fetch(`${CRM_BASE_URL}/deals/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRM_TOKEN}`
    },
    body: JSON.stringify(deal)
  });
}

async function appendNote(sessionId, note) {
  return fetch(`${CRM_BASE_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRM_TOKEN}`
    },
    body: JSON.stringify({ sessionId, note })
  });
}

http
  .createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/api/consult-intake") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const rawBody = await parseBody(req);
    const signature = req.headers["x-intake-signature"];

    if (!verifySignature(rawBody, signature)) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    const payload = JSON.parse(rawBody);
    const { sessionId, data } = payload;

    if (!data || !data.email) {
      res.writeHead(202);
      res.end("Accepted partial payload");
      return;
    }

    await upsertContact(mapContact(data));
    await upsertDeal(mapDeal(data));

    if (data.automation_goal) {
      await appendNote(sessionId, data.automation_goal);
    }

    if (data.notes) {
      await appendNote(sessionId, data.notes);
    }

    res.writeHead(200);
    res.end("OK");
  })
  .listen(PORT, () => {
    console.log(`Consult intake listening on ${PORT}`);
  });
```

## Test with curl

```bash
curl -X POST "http://localhost:3000/api/consult-intake" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","stepId":"email","timestamp":"2026-01-23T00:00:00Z","data":{"full_name":"Jane Doe","email":"jane@company.com","company":"Acme Co"}}'
```
