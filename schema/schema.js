const graphql = require('graphql')
const _ = require('lodash')
const axios = require('axios')

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
} = graphql;

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    // The way that closures works in javascript that the bellow function gets defined but not executed until after the entire file has been executed. So the entire file will get executed, that will define the UserType & the CompanyType then GraphQL internally will execute the bellow function & the UserType will be in the closure scope of the  anonymous function which makes everything to be correctly defined to work.
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            // there many users in list so graphqllist is used. 
            type: new GraphQLList(UserType),
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                    .then(res => res.data)
            }
        }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            resolve(parentValue, args) {
                return axios(`http://localhost:3000/companies/${parentValue.companyId}`)
                    .then(res => res.data)
            }
        }
    }
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(res => res.data)
            }
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                    .then(res => res.data)
            }
        }
    }
})

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                age: { type: new GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, { firstName, age }) {
                return axios.post(`http://localhost:3000/users`, { firstName, age })
                    .then(res => res.data)
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parentValue, { id }) {
                return axios.delete(`http://localhost:3000/users/${id}`)
                    .then(res => res.data)
            }
        },
        updateUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                firstName: { type: GraphQLString },
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, args) {
                // if the full args are given, the Id will not be updatable is json server doesn't support it.  
                return axios.patch(`http://localhost:3000/users/${args.id}`, args)
                    .then(res => res.data)
            }
        }
    }
})

module.exports = new GraphQLSchema({
    // associate RootQuery & mutation in GraphQLSchema
    query: RootQuery,
    mutation: mutation
})