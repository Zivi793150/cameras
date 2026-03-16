// Usage: node backend/scripts/backfill-slugs.js
// Requires env MONGO_URI

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}

function transliterate(str = '') {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  };
  return String(str)
    .toLowerCase()
    .replace(/[а-яё]/g, ch => map[ch] ?? ch)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g,'-')
    .replace(/^-+|-+$/g,'');
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('products');

  const cursor = col.find({});
  const seen = new Set();
  let updated = 0;

  while (await cursor.hasNext()) {
    const p = await cursor.next();
    const baseSlug = p.slug && typeof p.slug === 'string' && p.slug.trim() ? p.slug.trim() : transliterate(p.name || `product-${p._id}`);
    const catSlug = p.categorySlug && typeof p.categorySlug === 'string' && p.categorySlug.trim() ? p.categorySlug.trim() : transliterate(p.category || 'catalog');

    let finalSlug = baseSlug;
    let i = 2;
    while (seen.has(finalSlug)) {
      finalSlug = `${baseSlug}-${i++}`;
    }
    seen.add(finalSlug);

    const update = {};
    if (p.slug !== finalSlug) {
      update.slugHistory = Array.isArray(p.slugHistory) ? [...new Set([...(p.slugHistory||[]), p.slug].filter(Boolean))] : (p.slug ? [p.slug] : []);
      update.slug = finalSlug;
    }
    if (p.categorySlug !== catSlug) update.categorySlug = catSlug;

    if (Object.keys(update).length) {
      await col.updateOne({ _id: p._id }, { $set: update });
      updated++;
    }
  }

  console.log(`Backfill complete. Updated: ${updated}`);
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


