import { db } from '../src/lib/db/index.js';
import { businesses } from '../src/lib/db/schema/businesses.js';

const rows = await db.select({
  id: businesses.id,
  name: businesses.businessName,
  telnyx: businesses.telnyxPhoneNumber,
  forwarding: businesses.forwardingNumber,
  email: businesses.ownerEmail,
}).from(businesses).limit(3);

console.log(JSON.stringify(rows, null, 2));
process.exit(0);
