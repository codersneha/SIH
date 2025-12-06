import { prisma } from '../config/database';
import { generateKeyPair } from '../utils/ed25519';
import { generateDID, encrypt, hashMobile } from '../utils/crypto';
import { appendEconomicTx, appendQualityTx } from '../services/ledger';
import { generateProof } from '../zkp/prover';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

// Helper function to generate hash
function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Helper to generate batch ID
function generateBatchId(): string {
  const random = Math.random().toString(36).substring(2, 18).toUpperCase();
  return `BATCH-${random}`;
}

// Products data
const products = [
  { name: 'Tomatoes', varieties: ['Cherry Tomato', 'Roma', 'Beefsteak'], unit: 'kg' },
  { name: 'Wheat', varieties: ['IR-64', 'HD-3086', 'PBW-725'], unit: 'quintal' },
  { name: 'Rice', varieties: ['Basmati 1121', 'Sona Masuri', 'Ponni'], unit: 'kg' },
  { name: 'Potatoes', varieties: ['Kufri Jyoti', 'Kufri Bahar', 'Kufri Pukhraj'], unit: 'kg' },
  { name: 'Onions', varieties: ['Nashik Red', 'Pune Red', 'Kharif'], unit: 'kg' },
  { name: 'Mangoes', varieties: ['Kesar', 'Alphonso', 'Dasheri'], unit: 'kg' },
  { name: 'Bananas', varieties: ['Robusta', 'Grand Naine', 'Red Banana'], unit: 'kg' },
  { name: 'Cabbage', varieties: ['Golden Acre', 'Pride of India'], unit: 'kg' },
  { name: 'Cauliflower', varieties: ['Snowball', 'Early Kunwari'], unit: 'kg' },
  { name: 'Carrots', varieties: ['Pusa Meghali', 'Nantes'], unit: 'kg' },
];

const farmingMethods = ['organic', 'natural', 'conventional', 'integrated'];
const stages = ['harvest', 'sorting', 'transport', 'retail'];
const paymentMethods = ['UPI', 'Cash', 'Settlement'];

// Helper to generate proper Aadhaar (12 digits)
function generateAadhaar(): string {
  return `${Math.floor(Math.random() * 900000000000) + 100000000000}`;
}

// Helper to generate proper PM-KISAN (10-12 digits)
function generatePMKISAN(): string {
  return `${Math.floor(Math.random() * 90000000000) + 10000000000}`;
}

// Helper to generate proper mobile (10 digits starting with 9)
function generateMobile(): string {
  return `9${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

// Helper to generate proper GSTIN (15 chars: 2 state + 10 PAN + 1 entity + 1 check + 1 Z)
function generateGSTIN(stateCode: string = '22', pan?: string): string {
  const panValue = pan || generatePAN();
  const entity = '1'; // Entity number
  const check = String(Math.floor(Math.random() * 10)); // Check digit
  return `${stateCode}${panValue}${entity}${check}Z`;
}

// Helper to generate proper PAN (5 letters + 4 digits + 1 letter)
function generatePAN(): string {
  const letters1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letters2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let pan = '';
  for (let i = 0; i < 5; i++) {
    pan += letters1[Math.floor(Math.random() * letters1.length)];
  }
  for (let i = 0; i < 4; i++) {
    pan += digits[Math.floor(Math.random() * digits.length)];
  }
  pan += letters2[Math.floor(Math.random() * letters2.length)];
  return pan;
}

// Helper to generate proper Driver License (DL + 13 digits)
function generateDriverLicense(): string {
  return `DL${String(Math.floor(Math.random() * 9000000000000) + 1000000000000).padStart(13, '0')}`;
}

// Generate farmers
async function createFarmers() {
  const farmers = [];
  const farmerData = [
    { 
      name: 'Ram Kumar', 
      businessName: 'Kumar Organic Farms', 
      address: 'Village: Sonpur, District: Patna, Bihar', 
      trustScore: 0.92,
      idType: 'AADHAAR' as const,
    },
    { 
      name: 'Shyam Singh', 
      businessName: 'Singh Agro Products', 
      address: 'Village: Madhubani, District: Madhubani, Bihar', 
      trustScore: 0.88,
      idType: 'PMKISAN' as const,
    },
    { 
      name: 'Mohan Das', 
      businessName: 'Das Natural Farming', 
      address: 'Village: Gaya, District: Gaya, Bihar', 
      trustScore: 0.95,
      idType: 'AADHAAR' as const,
    },
    { 
      name: 'Suresh Yadav', 
      businessName: 'Yadav Fresh Produce', 
      address: 'Village: Muzaffarpur, District: Muzaffarpur, Bihar', 
      trustScore: 0.85,
      idType: 'PMKISAN' as const,
    },
    { 
      name: 'Rajesh Patel', 
      businessName: 'Patel Green Farms', 
      address: 'Village: Bhagalpur, District: Bhagalpur, Bihar', 
      trustScore: 0.90,
      idType: 'AADHAAR' as const,
    },
  ];

  const credentials: any[] = [];

  for (let i = 0; i < farmerData.length; i++) {
    const data = farmerData[i];
    const keyPair = generateKeyPair();
    const did = generateDID('farm', keyPair.publicKey);
    const mobile = generateMobile();
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const password = 'farmer123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate ID based on type
    const idValue = data.idType === 'AADHAAR' ? generateAadhaar() : generatePMKISAN();
    const encIdValue = encrypt(idValue);

    const user = await prisma.user.create({
      data: {
        role: 'FARMER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name: data.name,
        trustScore: data.trustScore,
        status: 'ACTIVE',
        passwordHash,
        farmerIdentity: {
          create: {
            encPmKisan: data.idType === 'PMKISAN' ? encIdValue : null,
            encAadhaar: data.idType === 'AADHAAR' ? encIdValue : null,
            name: data.name,
            businessName: data.businessName,
            address: data.address,
          },
        },
      },
    });

    // Store credentials for testing
    credentials.push({
      role: 'FARMER',
      name: data.name,
      did,
      mobile,
      password,
      idType: data.idType,
      idValue,
      businessName: data.businessName,
      address: data.address,
    });

    farmers.push({ ...user, did, mobile, idType: data.idType, idValue });
  }

  return { farmers, credentials };
}

// Generate transporters
async function createTransporters() {
  const transporters = [];
  const transporterData = [
    { name: 'Amit Logistics', companyName: 'Amit Transport Services', address: 'NH-16, Bhubaneswar, Odisha', vehicleRC: 'WB20AB1234', stateCode: '21' },
    { name: 'Kumar Freight', companyName: 'Kumar Logistics Pvt Ltd', address: 'NH-19, Patna, Bihar', vehicleRC: 'BR01CD5678', stateCode: '10' },
    { name: 'Express Cargo', companyName: 'Express Cargo Solutions', address: 'NH-44, Delhi NCR', vehicleRC: 'DL05EF9012', stateCode: '07' },
  ];

  const credentials: any[] = [];

  for (const data of transporterData) {
    const keyPair = generateKeyPair();
    const did = generateDID('trans', keyPair.publicKey);
    const mobile = generateMobile();
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const password = 'trans123';
    const passwordHash = await bcrypt.hash(password, 10);
    const gstin = generateGSTIN(data.stateCode);
    const driverLicense = generateDriverLicense();

    const user = await prisma.user.create({
      data: {
        role: 'TRANSPORTER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name: data.name,
        trustScore: 0.87,
        status: 'ACTIVE',
        passwordHash,
        transporterIdentity: {
          create: {
            encVehicleRC: encrypt(data.vehicleRC),
            encDriverLicense: encrypt(driverLicense),
            encGstin: encrypt(gstin),
            name: data.name,
            companyName: data.companyName,
            address: data.address,
          },
        },
      },
    });

    const deviceId = `device-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    await prisma.transportVehicle.create({
      data: {
        vehicleNo: data.vehicleRC,
        deviceId,
        transporterUserId: user.id,
      },
    });

    // Store credentials for testing
    credentials.push({
      role: 'TRANSPORTER',
      name: data.name,
      did,
      mobile,
      password,
      vehicleRC: data.vehicleRC,
      driverLicense,
      gstin,
      companyName: data.companyName,
      address: data.address,
      deviceId,
    });

    transporters.push({ ...user, did, vehicleRC: data.vehicleRC, mobile, gstin, driverLicense });
  }

  return { transporters, credentials };
}

// Generate retailers
async function createRetailers() {
  const retailers = [];
  const retailerData = [
    { name: 'FreshMart', shopName: 'FreshMart Supermarket', address: 'Shop 12, Main Market, Pune, Maharashtra', stateCode: '27' },
    { name: 'Green Grocers', shopName: 'Green Grocers Store', address: 'Mall Road, Patna, Bihar', stateCode: '10' },
    { name: 'Farm Fresh', shopName: 'Farm Fresh Outlet', address: 'Connaught Place, New Delhi', stateCode: '07' },
  ];

  const credentials: any[] = [];

  for (const data of retailerData) {
    const keyPair = generateKeyPair();
    const did = generateDID('retail', keyPair.publicKey);
    const mobile = generateMobile();
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const password = 'retail123';
    const passwordHash = await bcrypt.hash(password, 10);
    const pan = generatePAN();
    const gstin = generateGSTIN(data.stateCode, pan); // Use same PAN for GSTIN

    const user = await prisma.user.create({
      data: {
        role: 'RETAILER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name: data.name,
        trustScore: 0.89,
        status: 'ACTIVE',
        passwordHash,
        retailerIdentity: {
          create: {
            encGstin: encrypt(gstin),
            encPan: encrypt(pan),
            name: data.name,
            shopName: data.shopName,
            address: data.address,
          },
        },
      },
    });

    // Store credentials for testing
    credentials.push({
      role: 'RETAILER',
      name: data.name,
      did,
      mobile,
      password,
      gstin,
      pan,
      shopName: data.shopName,
      address: data.address,
    });

    retailers.push({ ...user, did, mobile, gstin, pan });
  }

  return { retailers, credentials };
}

// Generate Admin user
async function createAdmin() {
  const keyPair = generateKeyPair();
  const did = generateDID('admin', keyPair.publicKey);
  const mobile = '9999999999';
  const encMobile = encrypt(mobile);
  const mobileHash = hashMobile(mobile);
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      role: 'ADMIN',
      did,
      publicKey: keyPair.publicKey,
      encMobile,
      mobileHash,
      name: 'System Admin',
      trustScore: 1.0,
      status: 'ACTIVE',
      passwordHash,
    },
  });

  return {
    admin: user,
    credentials: {
      role: 'ADMIN',
      name: 'System Admin',
      did,
      mobile,
      password,
    },
  };
}

// Generate Consumers
async function createConsumers() {
  const consumers = [];
  const consumerData = [
    { name: 'Anita Sharma', address: 'Sector 15, Noida, UP' },
    { name: 'Vikram Reddy', address: 'Banjara Hills, Hyderabad' },
    { name: 'Priya Patel', address: 'Andheri West, Mumbai' },
  ];

  const credentials: any[] = [];

  for (const data of consumerData) {
    const keyPair = generateKeyPair();
    const did = generateDID('consumer', keyPair.publicKey);
    const mobile = generateMobile();
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const password = 'consumer123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role: 'CONSUMER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name: data.name,
        trustScore: 0.75,
        status: 'ACTIVE',
        passwordHash,
      },
    });

    credentials.push({
      role: 'CONSUMER',
      name: data.name,
      did,
      mobile,
      password,
      address: data.address,
    });

    consumers.push({ ...user, did, mobile });
  }

  return { consumers, credentials };
}

// Generate 25 batches with full lifecycle
async function createBatches(farmers: any[], transporters: any[], retailers: any[]) {
  const batches = [];
  const now = new Date();
  
  // Distribute batches across farmers (5 batches per farmer)
  for (let i = 0; i < 25; i++) {
    const farmer = farmers[i % farmers.length];
    const product = products[i % products.length];
    const variety = product.varieties[Math.floor(Math.random() * product.varieties.length)];
    const farmingMethod = farmingMethods[Math.floor(Math.random() * farmingMethods.length)];
    
    // Generate dates in a realistic timeline
    const daysAgo = 30 - (i % 30); // Spread over last 30 days
    const harvestDate = new Date(now);
    harvestDate.setDate(harvestDate.getDate() - daysAgo);
    
    const quantity = product.unit === 'quintal' 
      ? Math.floor(Math.random() * 50) + 10 // 10-60 quintals
      : Math.floor(Math.random() * 500) + 100; // 100-600 kg
    
    const sellingPrice = product.unit === 'quintal'
      ? Math.floor(Math.random() * 2000) + 3000 // ₹3000-5000 per quintal
      : Math.floor(Math.random() * 30) + 20; // ₹20-50 per kg
    
    const batchId = generateBatchId();
    
    // Create produce log
    const produceLog = await prisma.produceLog.create({
      data: {
        batchId,
        farmerDid: farmer.did,
        productName: product.name,
        variety,
        quantity,
        unit: product.unit,
        harvestDate,
        farmingMethod,
        sellingPrice,
        notes: `Quality batch from ${farmer.name}`,
      },
    });

    // Determine batch status and timeline
    const statusProgression = ['Registered', 'In Transit', 'Delivered', 'Sold'];
    const statusIndex = Math.min(Math.floor(i / 6), 3); // Distribute across statuses
    const status = statusProgression[statusIndex];
    
    let transporter: any = null;
    let retailer: any = null;
    let pickupDate: Date | null = null;
    let dropoffDate: Date | null = null;
    let receivedDate: Date | null = null;
    let soldDate: Date | null = null;
    
    if (statusIndex >= 1) {
      transporter = transporters[Math.floor(Math.random() * transporters.length)];
      pickupDate = new Date(harvestDate);
      pickupDate.setDate(pickupDate.getDate() + 1);
    }
    
    if (statusIndex >= 2) {
      dropoffDate = new Date(pickupDate!);
      dropoffDate.setDate(dropoffDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days
      retailer = retailers[Math.floor(Math.random() * retailers.length)];
      receivedDate = new Date(dropoffDate);
    }
    
    if (statusIndex >= 3) {
      soldDate = new Date(receivedDate!);
      soldDate.setDate(soldDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days
    }

    // Create Economic Ledger Entries
    let prevTxHash: string | null = null;

    // 1. FARMER_REGISTER
    const registerTx = await appendEconomicTx({
      batchId,
      payerDid: farmer.did,
      fromParty: 'FARMER',
      toParty: 'SYSTEM',
      product: product.name,
      quantity,
      amount: 0, // Registration has no amount
      paymentMethod: 'Settlement',
      meta: {
        type: 'FARMER_REGISTER',
        variety,
        farmingMethod,
      },
    });
    prevTxHash = registerTx.txHash;

    // 2. TRANSPORT_PICKUP (if in transit or beyond)
    if (statusIndex >= 1 && transporter && pickupDate) {
      const transportCost = Math.floor(quantity * 2); // ₹2 per unit
      const pickupTx = await appendEconomicTx({
        batchId,
        payerDid: farmer.did,
        payeeDid: transporter.did,
        fromParty: 'FARMER',
        toParty: 'TRANSPORTER',
        product: product.name,
        quantity,
        amount: transportCost,
        paymentMethod: 'UPI',
        meta: {
          type: 'TRANSPORT_PICKUP',
          vehicleRC: transporter.vehicleRC,
        },
      });
      prevTxHash = pickupTx.txHash;
    }

    // 3. TRANSPORT_DROPOFF (if delivered or sold)
    if (statusIndex >= 2 && transporter && retailer && dropoffDate) {
      const dropoffTx = await appendEconomicTx({
        batchId,
        payerDid: transporter.did,
        payeeDid: retailer.did,
        fromParty: 'TRANSPORTER',
        toParty: 'RETAILER',
        product: product.name,
        quantity,
        amount: 0, // Handover, no payment
        paymentMethod: 'Settlement',
        meta: {
          type: 'TRANSPORT_DROPOFF',
        },
      });
      prevTxHash = dropoffTx.txHash;
    }

    // 4. RETAILER_RECEIVE (if delivered or sold)
    if (statusIndex >= 2 && retailer && receivedDate) {
      const receiveTx = await appendEconomicTx({
        batchId,
        payerDid: retailer.did,
        fromParty: 'RETAILER',
        toParty: 'RETAILER',
        product: product.name,
        quantity,
        amount: 0,
        paymentMethod: 'Settlement',
        meta: {
          type: 'RETAILER_RECEIVE',
        },
      });
      prevTxHash = receiveTx.txHash;
    }

    // 5. RETAILER_SALE (if sold)
    if (statusIndex >= 3 && retailer && soldDate) {
      const unitsSold = Math.floor(quantity * (0.7 + Math.random() * 0.25)); // 70-95% sold
      const salePrice = sellingPrice * 1.2; // 20% markup
      const totalSales = unitsSold * salePrice;
      
      const saleTx = await appendEconomicTx({
        batchId,
        payerDid: retailer.did,
        fromParty: 'RETAILER',
        toParty: 'CONSUMER',
        product: product.name,
        quantity: unitsSold,
        amount: totalSales,
        paymentMethod: Math.random() > 0.5 ? 'UPI' : 'Cash',
        meta: {
          type: 'RETAILER_SALE',
          unitsSold,
          salePricePerUnit: salePrice,
        },
      });
      prevTxHash = saleTx.txHash;
    }

    // Create Quality Ledger Entries
    let prevQualityTxHash: string | null = null;

    // 1. Harvest stage
    const harvestQuality = await appendQualityTx({
      batchId,
      actorDid: farmer.did,
      stage: 'harvest',
      qualityScore: 85 + Math.floor(Math.random() * 15), // 85-100
      moistureLevel: 12 + Math.random() * 3, // 12-15%
      temperature: 25 + Math.random() * 5, // 25-30°C
      spoilageDetected: false,
      aiVerificationHash: generateHash(`${batchId}-harvest-${Date.now()}`),
      iotMerkleRoot: generateHash(`iot-${batchId}-harvest`),
    });
    prevQualityTxHash = harvestQuality.txHash;

    // 2. Sorting stage (if in transit or beyond)
    if (statusIndex >= 1) {
      const sortingQuality = await appendQualityTx({
        batchId,
        actorDid: farmer.did,
        stage: 'sorting',
        qualityScore: 80 + Math.floor(Math.random() * 15), // 80-95
        moistureLevel: 11 + Math.random() * 2, // 11-13%
        temperature: 22 + Math.random() * 3, // 22-25°C
        spoilageDetected: Math.random() < 0.1, // 10% chance
        aiVerificationHash: generateHash(`${batchId}-sorting-${Date.now()}`),
        iotMerkleRoot: generateHash(`iot-${batchId}-sorting`),
      });
      prevQualityTxHash = sortingQuality.txHash;
    }

    // 3. Transport stage (if in transit or beyond)
    if (statusIndex >= 1 && transporter) {
      const transportTemp = 4 + Math.random() * 8; // 4-12°C (cold chain)
      const spoilageChance = transportTemp > 10 ? 0.15 : 0.05; // Higher temp = more spoilage
      
      const transportQuality = await appendQualityTx({
        batchId,
        actorDid: transporter.did,
        stage: 'transport',
        qualityScore: 75 + Math.floor(Math.random() * 15), // 75-90
        moistureLevel: 10 + Math.random() * 2, // 10-12%
        temperature: transportTemp,
        spoilageDetected: Math.random() < spoilageChance,
        aiVerificationHash: generateHash(`${batchId}-transport-${Date.now()}`),
        iotMerkleRoot: generateHash(`iot-${batchId}-transport`),
      });
      prevQualityTxHash = transportQuality.txHash;
    }

    // 4. Retail stage (if delivered or sold)
    if (statusIndex >= 2 && retailer) {
      const retailQuality = await appendQualityTx({
        batchId,
        actorDid: retailer.did,
        stage: 'retail',
        qualityScore: 70 + Math.floor(Math.random() * 20), // 70-90
        moistureLevel: 9 + Math.random() * 2, // 9-11%
        temperature: 18 + Math.random() * 4, // 18-22°C
        spoilageDetected: Math.random() < 0.2, // 20% chance
        aiVerificationHash: generateHash(`${batchId}-retail-${Date.now()}`),
        iotMerkleRoot: generateHash(`iot-${batchId}-retail`),
      });
      prevQualityTxHash = retailQuality.txHash;
    }

    // Generate ZKP proofs for some batches
    // Quality proofs for transport stage (if applicable)
    if (statusIndex >= 1 && transporter) {
      try {
        const qualityProof = generateProof('quality', {
          moistureLevel: 8 + Math.random() * 3, // 8-11% (valid)
          temperature: 4 + Math.random() * 6, // 4-10°C (valid)
          sensorReadings: Array.from({ length: 5 }, () => 4 + Math.random() * 6), // Consistent readings
          batchId,
          stage: 'transport',
        });

        await prisma.zkpLog.create({
          data: {
            did: transporter.did,
            batchId,
            proofType: 'QUALITY',
            proofPayload: JSON.stringify(qualityProof),
            verified: true,
            message: 'Quality proof generated and verified successfully',
          },
        });
      } catch (error) {
        // Skip if conditions not met
        console.log(`Skipping quality proof for batch ${batchId}`);
      }
    }

    // Economic proofs for sold batches
    if (statusIndex >= 3 && retailer) {
      try {
        const unitsSold = Math.floor(quantity * (0.7 + Math.random() * 0.25));
        const economicProof = generateProof('economic', {
          paymentAmount: sellingPrice * unitsSold,
          totalQuantity: quantity,
          soldQuantity: unitsSold,
          batchId,
          transactionId: `TXN-${batchId}-${Date.now()}`,
        });

        await prisma.zkpLog.create({
          data: {
            did: retailer.did,
            batchId,
            proofType: 'ECONOMIC',
            proofPayload: JSON.stringify(economicProof),
            verified: true,
            message: 'Economic proof generated and verified successfully',
          },
        });
      } catch (error) {
        console.log(`Skipping economic proof for batch ${batchId}`);
      }
    }

    // Route proofs for transported batches (random selection)
    if (statusIndex >= 1 && transporter && Math.random() > 0.5) {
      try {
        const routeProof = generateProof('route', {
          gpsPoints: [
            { lat: 28.6139 + Math.random() * 0.1, lng: 77.2090 + Math.random() * 0.1, timestamp: Date.now() - 3600000 },
            { lat: 28.6140 + Math.random() * 0.1, lng: 77.2091 + Math.random() * 0.1, timestamp: Date.now() - 1800000 },
            { lat: 19.0760 + Math.random() * 0.1, lng: 72.8777 + Math.random() * 0.1, timestamp: Date.now() },
          ],
          expectedRoute: 'Farm to Retailer',
          batchId,
        });

        await prisma.zkpLog.create({
          data: {
            did: transporter.did,
            batchId,
            proofType: 'ROUTE',
            proofPayload: JSON.stringify(routeProof),
            verified: true,
            message: 'Route proof generated and verified successfully',
          },
        });
      } catch (error) {
        console.log(`Skipping route proof for batch ${batchId}`);
      }
    }

    batches.push({
      batchId,
      productName: product.name,
      variety,
      quantity,
      unit: product.unit,
      farmingMethod,
      harvestDate,
      farmerDid: farmer.did,
      transporterDid: transporter?.did || null,
      retailerDid: retailer?.did || null,
      status,
      sellingPrice,
    });
  }

  return batches;
}

// Seed supply quantities with random values
async function seedSupplyQuantities() {
  // Import supply prices from suppliesController
  const { supplyPrices } = await import('../controllers/suppliesController');
  
  // Get all supply price keys
  const supplyPriceKeys = Object.keys(supplyPrices);
  
  for (const productId of supplyPriceKeys) {
    const supplyData = supplyPrices[productId];
    
    // Check if quantity already exists
    const existing = await prisma.supplyQuantity.findUnique({
      where: { productId },
    });

    if (!existing) {
      // Generate random quantity between 50 and 500
      const randomQuantity = Math.floor(Math.random() * 450) + 50;
      await prisma.supplyQuantity.create({
        data: {
          productId,
          quantity: randomQuantity,
          unit: supplyData.unit,
        },
      });
    } else if (existing.quantity === 0) {
      // If quantity is 0, initialize with random value
      const randomQuantity = Math.floor(Math.random() * 450) + 50;
      await prisma.supplyQuantity.update({
        where: { productId },
        data: { quantity: randomQuantity },
      });
    }
  }
}

// Main seed function
export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await prisma.zkpLog.deleteMany();
    await prisma.qualityLedgerTx.deleteMany();
    await prisma.economicLedgerTx.deleteMany();
    await prisma.produceLog.deleteMany();
    await prisma.transportVehicle.deleteMany();
    await prisma.retailerIdentity.deleteMany();
    await prisma.transporterIdentity.deleteMany();
    await prisma.farmerIdentity.deleteMany();
    await prisma.user.deleteMany();

    console.log('Creating farmers...');
    const { farmers, credentials: farmerCredentials } = await createFarmers();
    console.log(`✅ Created ${farmers.length} farmers`);

    console.log('Creating transporters...');
    const { transporters, credentials: transporterCredentials } = await createTransporters();
    console.log(`✅ Created ${transporters.length} transporters`);

    console.log('Creating retailers...');
    const { retailers, credentials: retailerCredentials } = await createRetailers();
    console.log(`✅ Created ${retailers.length} retailers`);

    console.log('Creating admin...');
    const { admin, credentials: adminCredentials } = await createAdmin();
    console.log(`✅ Created admin user`);

    console.log('Creating consumers...');
    const { consumers, credentials: consumerCredentials } = await createConsumers();
    console.log(`✅ Created ${consumers.length} consumers`);

    console.log('Creating 25 batches with full lifecycle...');
    const batches = await createBatches(farmers, transporters, retailers);
    console.log(`✅ Created ${batches.length} batches`);

    // Seed supply quantities with random values
    console.log('Initializing supply quantities...');
    await seedSupplyQuantities();
    console.log('✅ Supply quantities initialized');

    // Seed supply quantities with random values
    console.log('Initializing supply quantities...');
    await seedSupplyQuantities();
    console.log('✅ Supply quantities initialized');

    // Get ledger counts
    const economicCount = await prisma.economicLedgerTx.count();
    const qualityCount = await prisma.qualityLedgerTx.count();
    const zkpCount = await prisma.zkpLog.count();

    // Combine all credentials
    const allCredentials = {
      admin: adminCredentials,
      farmers: farmerCredentials,
      transporters: transporterCredentials,
      retailers: retailerCredentials,
      consumers: consumerCredentials,
    };

    // Write credentials to file for easy testing
    const credentialsPath = path.join(process.cwd(), 'SEED_CREDENTIALS.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(allCredentials, null, 2));
    console.log(`\n📝 Credentials saved to: ${credentialsPath}`);

    console.log('\n📊 Seed Summary:');
    console.log(`   Admin: 1`);
    console.log(`   Farmers: ${farmers.length}`);
    console.log(`   Transporters: ${transporters.length}`);
    console.log(`   Retailers: ${retailers.length}`);
    console.log(`   Consumers: ${consumers.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Economic Ledger Entries: ${economicCount}`);
    console.log(`   Quality Ledger Entries: ${qualityCount}`);
    console.log(`   ZKP Proofs: ${zkpCount}`);
    console.log('\n✅ Database seeded successfully!');
    console.log('\n💡 Login Credentials:');
    console.log('   - Admin: mobile: 9999999999, password: admin123');
    console.log('   - Farmers: Use mobile number or DID, password: farmer123');
    console.log('   - Transporters: Use mobile number or DID, password: trans123');
    console.log('   - Retailers: Use mobile number or DID, password: retail123');
    console.log('   - Consumers: Use mobile number or DID, password: consumer123');
    console.log(`   - Full credentials saved in: ${credentialsPath}\n`);

    return {
      admin,
      farmers,
      transporters,
      retailers,
      consumers,
      batches,
      economicCount,
      qualityCount,
      credentials: allCredentials,
    };
  } catch (error: any) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

// Seed function is exported and called from seed.ts

