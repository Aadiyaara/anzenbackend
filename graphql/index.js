const graphql = require('graphql')
const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLID, GraphQLList, GraphQLInt, GraphQLNonNull, GraphQLBoolean, GraphQLFloat } = graphql
const mongoose = require('mongoose')
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anzen.kulstuff@gmail.com',
    pass: 'anzenKul'
  }
});

// Schema
const User = require('../schema/User')
const Pool = require('../schema/Pool')
const Path = require('../schema/Path')
const SOS = require('../schema/SOS')
const Contact = require('../schema/Contact')
const Blog = require('../schema/Blog')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        email: {type: GraphQLNonNull(GraphQLString)},
        mobile: {type: GraphQLNonNull(GraphQLString)},
        tokenizedPassword: {type: GraphQLString},
        address: {type: GraphQLNonNull(GraphQLString)},
        pool: {
            type: PoolType,
            resolve(parent, args) {
                return Pool.findOne({users: {$in: parent.id}})
            }
        },
        dateLastLogin: {type: GraphQLString},
        dateCreated: {type: GraphQLNonNull(GraphQLString)},
        paths: {
            type: GraphQLList(PathType),
            resolve(parent, args) {
                return Path.find({user: parent.id})
            }
        },
        SOSs: {
            type: GraphQLList(SOSType),
            resolve(parent, args) {
                return SOS.find({user: parent.id})
            }
        },
        status: {
            type: GraphQLString,
            required: true
        }
    })
})

const SOSType = new GraphQLObjectType({
    name: 'SOS',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        kind: {type: GraphQLNonNull(GraphQLString)},
        user: {
            type: GraphQLNonNull(UserType),
            resolve(parent,args) {
                return User.findOne({SOSs: {$in: parent.id}})
            }
        },
        contact: {
            type: GraphQLNonNull(ContactType),
            resolve (parent, args) {
                return Contact.findOne({SOSs: {$in: parent.id}})
            }
        },
        message: {type: GraphQLNonNull(GraphQLString)},
        dateCreated: {type: GraphQLNonNull(GraphQLString)},
        status: {type: GraphQLNonNull(GraphQLString)}
    })
})

const ContactType = new GraphQLObjectType({
    name: 'Contact',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        user: {
            type: GraphQLNonNull(UserType),
            resolve(parent,args) {
                return User.findOne({SOSs: {$in: parent.id}})
            }
        },
        SOSs: {
            type: GraphQLList(SOSType),
            resolve(parent, args) {
                return SOS.find({contact: parent.id})
            }
        },
        assistMobile: {type: GraphQLNonNull(GraphQLString)},
        assistEmail: {type: GraphQLNonNull(GraphQLString)},
        message: {type: GraphQLNonNull(GraphQLString)},
        validFor: {type: GraphQLNonNull(GraphQLString)},
        dateCreated: {type: GraphQLNonNull(GraphQLString)},
        status: {type: GraphQLNonNull(GraphQLString)}
    })
})

const PoolType = new GraphQLObjectType({
    name: 'Pool',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        users: {
            type: GraphQLList(UserType),
            resolve(parent, args) {
                return Users.find({pool: parent.id})
            }
        },
        paths: {
            type: GraphQLList(PathType),
            resolve(parent, args) {
                return Path.find({pool: parent.id})
            }
        },
        num: {type: GraphQLNonNull(GraphQLInt)},
        status: {type: GraphQLNonNull(GraphQLString)},
        dateCreated: {type: GraphQLNonNull(GraphQLString)}
    })
})

const PathType = new GraphQLObjectType({
    name: 'Path',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        kind: {type: GraphQLNonNull(GraphQLString)},
        pool: {
            type: PoolType,
            resolve(parent, args) {
                return Pool.findOne({paths: {$in: parent.id}})
            }
        },
        user: {
            type: UserType,
            resolve(parent, args) {
                return User.findOne({paths: {$in: parent.id}})
            }
        },
        source: {type: GraphQLNonNull(GraphQLString)},
        destination: {type: GraphQLNonNull(GraphQLString)},
        status: {type: GraphQLNonNull(GraphQLString)},
        dateCreated: {type: GraphQLNonNull(GraphQLString)}
    })
})

const BlogType = new GraphQLObjectType({
    name: 'Blog',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        kind: {type: GraphQLNonNull(GraphQLString)},
        name: {type: GraphQLNonNull(GraphQLString)},
        description: {type: GraphQLNonNull(GraphQLString)},
        title: {type: GraphQLNonNull(GraphQLString)},
        body: {type: GraphQLNonNull(GraphQLString)},
        highlights: {
            type: GraphQLList(GraphQLString)
        },
        images: {
            type: GraphQLList(GraphQLString)
        },
        dateCreated: {type: GraphQLNonNull(GraphQLString)},
        status: {type: GraphQLNonNull(GraphQLString)}
    })
})

const AuthDataType = new GraphQLObjectType({
    name: 'AuthData',
    fields: () => ({
        userId: {type: GraphQLNonNull(GraphQLString)},
        token: {type: GraphQLNonNull(GraphQLString)},
        tokenExpiration: {type: GraphQLNonNull(GraphQLString)}
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        getUser: {
            type: GraphQLNonNull(UserType),
            async resolve(parent, args, req) {
                try {
                    console.log(req)
                    if(!req.isAuth) {
                        return new Error('Unauthorized')
                    }
                    return await User.findById(req.userId)
                }
                catch (err) {
                    console.log('Error getting this user: ', err)
                    return err
                }
            }
        },
        getUserById: {
            type: UserType,
            args: {
                id: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args) {
                try {
                    const user = await User.findById(args.id)
                    return user
                }
                catch (err) {
                    console.log('Error getting user by ID: ', err)
                    return err
                }
            }
        },
        getUsers: {
            type: GraphQLList(UserType),
            async resolve(parent, args) {
                try {
                    const users = await User.find()
                    return users
                }
                catch (err) {
                    console.log('Error getting all the users: ', err)
                    return err
                }
            }
        },
        loginUser: {
            type: GraphQLNonNull(AuthDataType),
            args: {
                email: {type: GraphQLNonNull(GraphQLString)},
                password: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args) {
                try {
                    const user = await User.findOne({ email: args.email })
                    if(!user) {
                        console.log('User does not Exist')
                        throw new Error('User does not exist')
                    }
                    const isEqual = await bcrypt.compare(args.password, user.tokenizedPassword)
                    if(!isEqual) throw new Error('Invalid Password')
                    const token = jwt.sign({userId: user.id}, 'ninenine', {
                        expiresIn: '8760h'
                    })
                    return { userId: user.id, token: token, tokenExpiration: 8760 }
                }
                catch (err) {
                    console.log('Error loggin in the user: ', err)
                    return err
                }
            }
        },
        getSOSs: {
            type: GraphQLList(SOSType),
            async resolve(parent, args, req) {
                try {
                    return await SOS.find({user: req.userId})
                }   
                catch (err) {
                    console.log('Error getting all SOSs: ', err)
                    return err
                }             
            }
        },
        getContacts: {
            type: GraphQLList(SOSType),
            async resolve(parent, args, req) {
                try {
                    return await Contact.find({user: req.userId})
                }   
                catch (err) {
                    console.log('Error getting all SOSs: ', err)
                    return err
                }             
            }
        },
        getPaths: {
            type: GraphQLList(SOSType),
            async resolve(parent, args, req) {
                try {
                    return await Contact.find({user: req.userId})
                }   
                catch (err) {
                    console.log('Error getting all SOSs: ', err)
                    return err
                }             
            }
        },
        getPool: {
            type: PoolType,
            async resolve(parent, args, req) {
                return await Pool.findOne({users: {$in: req.id}})
            }
        },
        getAllPools: {
            type: GraphQLList(PoolType),
            async resolve (parent, arg, req) {
                return await Pool.find()
            }
        },
        getAllPaths: {
            type: GraphQLList(PathType),
            async resolve(parent, args, req) {
                return await Path.find()
            }
        },
        getUserPaths: {
            type: GraphQLList(PathType),
            async resolve(parent, args, req) {
                return await Path.find({user: req.userId})
            }
        },
        getBlogById: {
            type: GraphQLNonNull(BlogType),
            args: {
                id: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args) {
                return await Blog.findById(args.id)
            }
        }
    }
})

const RootMutation = new GraphQLObjectType({
    name: 'RootMutation',
    fields: {
        createUser: {
            type: AuthDataType,
            args: {
                name: {type: GraphQLNonNull(GraphQLString)},
                email: {type: GraphQLNonNull(GraphQLString)},
                password: {type: GraphQLNonNull(GraphQLString)},
                address: {type: GraphQLNonNull(GraphQLString)},
                mobile: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args) {
                try {
                    const user = await User.findOne({ email: args.email })
                    if(user) {
                        throw new Error('User exists already')
                    }
                    const hashedPassword = await bcrypt.hash(args.password, 12)
                    const newUser = new User({
                        name: args.name,
                        email: args.email,
                        tokenizedPassword: hashedPassword,
                        address: args.address,
                        mobile: args.mobile,
                        dateCreated: new Date().toDateString(),
                        dateLastlogin: new Date().toDateString(),
                        status: 'Active'
                    })
                    const savedUser = await newUser.save()
                    const token = jwt.sign({userId: savedUser.id}, 'ninenine', {
                        expiresIn: '8760h'
                    })
                    return { userId: savedUser.id, token: token, tokenExpiration: 8760 }
                }
                catch (err) {
                    console.log('Error Creating a new User')
                    return err
                }
            }
        },
        createPool: {
            type: GraphQLNonNull(PoolType),
            args: {
                name: {type: GraphQLNonNull(GraphQLString)},
                pathId: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args, req) {
                const users = [req.userId]
                const paths = [pathId]
                const pool = new Pool({
                    name: args.name,
                    paths: paths,
                    num: 1,
                    users: users,
                    dateCreated: new Date().toDateString(),
                    status: 'Open'
                })
                const newPool = await pool.save()
                await User.findByIdAndUpdate(req.userId, {pool: newPool.id}, {new: true})
                return newPool
            }
        },
        joinPool: {
            type: GraphQLNonNull(PoolType),
            args: {
                poolId: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve (parent, args, req) {
                await User.findByIdAndUpdate(req.userId, {pool: args.poolId}, {new: true})
                const addedPool = await Pool.findByIdAndUpdate(args.poolId, {$push: {users: req.userId}}, {new: true})
                return await addedPool.save()
            }
        },
        updateUser: {
            type: UserType,
            args: {
                userId: {type: GraphQLNonNull(GraphQLString)},
                name: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString},
                address: {type: GraphQLString},
                mobile: {type: GraphQLString}
            },
            async resolve(parent, args, req) {
                try {
                    if(!req.userId) {
                        throw new Error('Unauthorized')
                    }
                    const oldUserInfo = await User.findById(args.userId)
                }
                catch (err) {
                    console.log('Error Updating User Details: ', err)
                    return err
                }
            }
        },
        addUserPath: {
            type: GraphQLNonNull(PathType),
            args: {
                name: {type: GraphQLNonNull(GraphQLString)},
                kind: {type: GraphQLNonNull(GraphQLString)},
                source: {type: GraphQLNonNull(GraphQLString)},
                destination: {type: GraphQLNonNull(GraphQLString)},
            },
            async resolve (parent, args, req) {
                const path = new Path({
                    name: args.name,
                    kind: args.kind,
                    pool: args.pool,
                    souce: args.source,
                    destination: args.destination,
                    user: req.userId,
                    dateCreated: new Date().toDateString(),
                    status: 'Active'
                })
                return await path.save()
            }
        },
        addPoolPath: {
            type: GraphQLNonNull(PathType),
            args: {
                name: {type: GraphQLNonNull(GraphQLString)},
                kind: {type: GraphQLNonNull(GraphQLString)},
                source: {type: GraphQLNonNull(GraphQLString)},
                destination: {type: GraphQLNonNull(GraphQLString)},
            },
            async resolve (parent, args, req) {
                const path = new Path({
                    name: args.name,
                    kind: args.kind,
                    pool: args.pool,
                    souce: args.source,
                    destination: args.destination,
                    user: req.userId,
                    dateCreated: new Date().toDateString(),
                    status: 'Active'
                })
                return await path.save()
            }
        },
        addUserContact: {
            type: GraphQLNonNull(ContactType),
            args: {
                name: {type: GraphQLNonNull(GraphQLString)},
                assistMobile: {type: GraphQLNonNull(GraphQLString)},
                assistEmail: {type: GraphQLNonNull(GraphQLString)},
                message: {type: GraphQLNonNull(GraphQLString)},
                validFor: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, args, req) {
                const contact = new Contact({
                    name: args.name,
                    assistEmail: args.assistEmail,
                    assistMobile: args.assistMobile,
                    message: args.message,
                    user: req.userId,
                    validFor: args.validFor,
                    dateCreated: new Date().toDateString(),
                    status: 'Active'
                })
                const newContact =  await contact.save()
                await User.findByIdAndUpdate(req.userId, {$push: {contacts: newContact.id}}, {new: true})
                return newContact
            }
        },
        removeUserContact: {
            type: GraphQLNonNull(ContactType),
            args: {
                contactId: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve (parent, args, req) {
                try {
                    await User.findByIdAndUpdate(req.userId, {$pull: {contacts: newContact.id}}, {new: true})
                    await Contact.findByIdAndDelete(args.contactId)
                }
                catch (err) {
                    console.log('Error Deleting the Contact: ', err)
                }
                finally {
                    return 'Success'
                }
            }
        },
        sendSOS: {
            type: GraphQLNonNull(SOSType),
            args: {
                contactId: {type: GraphQLNonNull(GraphQLString)},
                name: {type: GraphQLNonNull(GraphQLString)},
                kind: {type: GraphQLNonNull(GraphQLString)},
                message: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve (parent, args, req) {
                const newSOS = new SOS({
                    name: args.name,
                    kind: args.kind,
                    messgae: args.message,
                    user: req.userId,
                    contact: args.contactI,
                    dateCreated: new Date().toDateString(),
                    status: 'Active'
                })
                var mailOptions = {
                    from: 'anzen.kulstuff@gmail.com',
                    to: elem.assistEmail,
                    subject: 'SOS Alert',
                    text: args.message
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        throw error
                    }
                    else {
                        console.log('Email sent: ' + info.response)
                    }
                })
                const newSOS = await newSOS.save()
                await User.findByIdAndUpdate(req.userId, {$push: {SOSs: newSOS.id}}, {new: true})
                await Contact.findByIdAndUpdate(contactId, {$push: {SOSs: newSOS.id}}, {new: true})
            }
        },
        revokeSOS: {
            type: GraphQLNonNull(SOSType),
            args: {
                sosId: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve (parent, args, req) {
                var mailOptions = {
                    from: 'anzen.kulstuff@gmail.com',
                    to: elem.assistEmail,
                    subject: 'SOS Alert',
                    text: 'Situation under control'
                }
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        throw error
                    }
                    else {
                        console.log('Email sent: ' + info.response)
                    }
                })
                return await SOS.findByIdAndUpdate(sosId, {
                    status: 'Resolved'
                }, {
                    new: true
                })
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})