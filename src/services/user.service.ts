import { connectDB } from '~/libs/db';

import { User } from '~/models/user.model';
import { hashPassword, verifyPassword } from '~/services/hash.service';
import { InterfaceUser, InterfaceBrand, InterfaceChannel, EnumUserRole } from '~/types/common';
export const CreateUser = async (username: string, password: string, name: string, email: string, role: EnumUserRole = EnumUserRole.STAFF): Promise<boolean> => {
    await connectDB()

    const existingUser = await User.findOne({ $or: [ { username }, { email } ] })
    if (existingUser) {
        return false
    }
    const hashedPassword = await hashPassword(password)
    const newUser = new User({ username, password: hashedPassword, name, email, role })
    await newUser.save()
    return true
}

export const AuthUser = async (username: string, password: string): Promise<boolean> => {
    await connectDB()

    const user = await User.findOne({ username })

    if (!user) {
        return false
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    return isPasswordValid
}

export const GetUserById = async (userId: string): Promise<any> => {
    await connectDB()

    const user = await User.findById(userId).lean()
    return user
}

export const UpdateUserUsername = async (userId: string, newUsername: string): Promise<boolean> => {
    await connectDB()

    const existingUser = await User.findOne({ username: newUsername })
    if (existingUser) {
        return false
    }

    await User.updateOne({ _id: userId }, { username: newUsername })
    return true
}

export const UpdateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    await connectDB()

    const hashedPassword = await hashPassword(newPassword)
    await User.updateOne({ _id: userId }, { password: hashedPassword })
}

export const UpdateUserRole = async (userId: string, newRole: string): Promise<void> => {
    await connectDB()

    await User.updateOne({ _id: userId }, { role: newRole })
}

export const UpdateUserEmail = async (userId: string, newEmail: string): Promise<boolean> => {
    await connectDB()

    const existingUser = await User.findOne({ email: newEmail })
    if (existingUser) {
        return false
    }

    await User.updateOne({ _id: userId }, { email: newEmail })
    return true
}

export const UpdateUserName = async (userId: string, newName: string): Promise<void> => {
    await connectDB()

    await User.updateOne({ _id: userId }, { name: newName })
}

export const UpdateUserPermissions = async (userId: string, assignedChannels: InterfaceChannel[], assignedBrands: InterfaceBrand[], customPermissions: string[]): Promise<void> => {
    await connectDB()
    let channelIds = assignedChannels.map(channel => channel._id);
    let brandIds = assignedBrands.map(brand => brand._id);
    // console.log('Updating /user permissions:', { userId, channelIds, brandIds, customPermissions });
    try{
        await User.updateOne({ _id: userId }, { assignedChannels: channelIds, assignedBrands: brandIds,  customPermissions: customPermissions })
    } catch (error) {
        console.error('Error updating user permissions:', error);
    }
    // console.log("herre")
}