const graphql = require('graphql')
const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLID, GraphQLList, GraphQLInt, GraphQLNonNull, GraphQLBoolean, GraphQLFloat } = graphql
const mongoose = require('mongoose')

// Schema
const User = require('../schema/User')
const Pool = require('../schema/Pool')
const Path = require('../schema/Path')
const SOS = require('../schema/SOS')
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
        createSOS: {
            type: GraphQLNonNull(SOSType),
            args: {
                name: {type: GraphQLString}
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
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})