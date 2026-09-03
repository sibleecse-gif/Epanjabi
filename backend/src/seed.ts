import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const IMG = process.env.SEED_IMAGE_PROVIDER || 'https://picsum.photos/seed';

function img(seed: string, w = 800, h = 1000) {
  return `${IMG}/${seed}/${w}/${h}`;
}

const categories = [
  { name: 'শার্ট', slug: 'shirt', icon: '👔', description: 'Casual & formal shirts' },
  { name: 'পাঞ্জাবি', slug: 'punjabi', icon: '🥻', description: 'Traditional panjabi for men' },
  { name: 'টি-শার্ট', slug: 't-shirt', icon: '👕', description: 'Cotton t-shirts' },
  { name: 'প্যান্ট', slug: 'pant', icon: '👖', description: 'Trousers & jeans' },
  { name: 'জামদানি', slug: 'jamdani', icon: '🧵', description: 'Jamdani sarees & panjabi' },
  { name: 'হুডি', slug: 'hoodie', icon: '🧥', description: 'Hoodies & sweaters' },
];

interface SeedProduct {
  name: string;
  category: string;
  price: number;
  comparePrice?: number;
  description: string;
  sizes: string[];
  stock: number;
  featured?: boolean;
  imgSeed: string;
}

const products: SeedProduct[] = [
  {
    name: 'ক্যাজুয়াল চেক শার্ট',
    category: 'shirt',
    price: 1299,
    comparePrice: 1699,
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 40,
    featured: true,
    description:
      'প্রিমিয়াম কটন ফেব্রিক দিয়ে তৈরি চেক প্যাটার্নের ক্যাজুয়াল শার্ট। অফিস ও দৈনন্দিন ব্যবহারের জন্য পারফেক্ট। হাত ধোয়া ও মেশিন ওয়াশ করা যায়।',
    imgSeed: 'check-shirt',
  },
  {
    name: 'স্লিম ফিট ফরমাল শার্ট',
    category: 'shirt',
    price: 1499,
    comparePrice: 1999,
    sizes: ['M', 'L', 'XL'],
    stock: 30,
    description:
      'স্লিম ফিট ডিজাইনের আনুষ্ঠানিক শার্ট। উইংকল-ফ্রি ফেব্রিক, স্মার্ট লুকের জন্য অফিস কলিগদের প্রথম পছন্দ।',
    imgSeed: 'formal-shirt',
  },
  {
    name: 'রয়েল কটন পাঞ্জাবি',
    category: 'punjabi',
    price: 1899,
    comparePrice: 2400,
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 25,
    featured: true,
    description:
      'ঈদ ও পারিবারিক অনুষ্ঠানের জন্য রাজকীয় কটন পাঞ্জাবি। আরামদায়ক ফেব্রিক ও সুন্দর কাজ।',
    imgSeed: 'punjabi-royal',
  },
  {
    name: 'জামদানি বর্ডার পাঞ্জাবি',
    category: 'jamdani',
    price: 2499,
    comparePrice: 3200,
    sizes: ['L', 'XL', 'XXL'],
    stock: 12,
    featured: true,
    description: 'নকশি জামদানি বর্ডার সহ প্রিমিয়াম পাঞ্জাবি। বিবাহ ও অনুষ্ঠানের জন্য বিশেষ সংস্করণ।',
    imgSeed: 'jamdani-punjabi',
  },
  {
    name: 'কটন ক্রু নেক টি-শার্ট',
    category: 't-shirt',
    price: 649,
    comparePrice: 899,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 100,
    description: '১০০% কম্বড কটনের আরামদায়ক টি-শার্ট। প্রতিদিন পরার জন্য সবচেয়ে জনপ্রিয়।',
    imgSeed: 'tshirt-crew',
  },
  {
    name: 'প্রিমিয়াম ওভারসাইজ টি-শার্ট',
    category: 't-shirt',
    price: 799,
    comparePrice: 1099,
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 60,
    featured: true,
    description: 'ট্রেন্ডি ওভারসাইজ ফিট। সফট টাচ প্রিন্ট, শীতল ও শ্বাস-উপযোগী কটন।',
    imgSeed: 'tshirt-oversize',
  },
  {
    name: 'স্ট্রেট ফিট জিন্স প্যান্ট',
    category: 'pant',
    price: 1599,
    comparePrice: 2100,
    sizes: ['28', '30', '32', '34', '36'],
    stock: 35,
    description: 'স্ট্রেচ ডেনিম ফেব্রিকের স্ট্রেট ফিট প্যান্ট। দীর্ঘস্থায়ী কালার ও ক্ল্যাসিক কাট।',
    imgSeed: 'jeans-straight',
  },
  {
    name: 'চিনো ট্রাউজার',
    category: 'pant',
    price: 1399,
    comparePrice: 1800,
    sizes: ['30', '32', '34', '36'],
    stock: 28,
    description: 'ব্যবসায়িক ও ক্যাজুয়াল দুই জায়গাতেই মানানসই চিনো ট্রাউজার।',
    imgSeed: 'chino-pant',
  },
  {
    name: 'ফ্লিস হুডি',
    category: 'hoodie',
    price: 1799,
    comparePrice: 2299,
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 20,
    description: 'শীতের জন্য পলি-কটন ফ্লিস হুডি। ঝকঝকে প্রিন্ট ও উষ্ণতার নিশ্চয়তা।',
    imgSeed: 'hoodie-fleece',
  },
  {
    name: 'ক্যাজুয়াল জার্সি হুডি',
    category: 'hoodie',
    price: 1599,
    sizes: ['M', 'L', 'XL'],
    stock: 15,
    description: 'হালকা ওজনের জার্সি হুডি, বসন্ত-শরৎকালের জন্য উপযুক্ত।',
    imgSeed: 'hoodie-jersey',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aagdoom.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';

  const [admin, customer] = await Promise.all([
    prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: await bcrypt.hash(adminPass, 10),
        name: 'Aagdoom Admin',
        phone: '01700000000',
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer@aagdoom.com' },
      update: {},
      create: {
        email: 'customer@aagdoom.com',
        password: await bcrypt.hash('Customer@123', 10),
        name: 'রাহিম উদ্দিন',
        phone: '01811112222',
        role: Role.USER,
      },
    }),
  ]);
  console.log(`✅ Admin: ${admin.email} / ${adminPass}`);
  console.log(`✅ Customer: ${customer.email} / Customer@123`);

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    catMap.set(c.slug, saved.id);
  }
  console.log(`✅ ${categories.length} categories`);

  let created = 0;
  for (const p of products) {
    const categoryId = catMap.get(p.category)!;
    const slug = p.name
      .toLowerCase()
      .trim()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    let finalSlug = slug;
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${n++}`;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: finalSlug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        categoryId,
        sizes: p.sizes,
        stock: p.stock,
        isFeatured: p.featured ?? false,
        sku: `AGD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        images: {
          create: [
            { url: img(`${p.imgSeed}`), alt: p.name, isPrimary: true, sortOrder: 0 },
            { url: img(`${p.imgSeed}-2`), alt: `${p.name} view 2`, sortOrder: 1 },
            { url: img(`${p.imgSeed}-3`), alt: `${p.name} view 3`, sortOrder: 2 },
          ],
        },
      },
    });
    created += 1;
  }
  console.log(`✅ ${created} products`);

  console.log('🎉 Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());