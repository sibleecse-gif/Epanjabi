import { prisma } from '../../config/database';
import { CreateAddressInput, UpdateProfileInput } from './user.types';

export class UserService {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
    });
  }

  async listAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, input: CreateAddressInput) {
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: { ...input, userId },
    });
    return address;
  }

  async updateAddress(userId: string, addressId: string, input: Partial<CreateAddressInput>) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      const err = new Error('Address not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    if (input.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data: input });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      const err = new Error('Address not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    await prisma.address.delete({ where: { id: addressId } });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      const err = new Error('Address not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
  }
}