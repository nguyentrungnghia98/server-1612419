module.exports = {
  database: "mongodb+srv://admin:nghia123@serverreact-5caou.mongodb.net/test?retryWrites=true&w=majority",
  port: process.env.PORT|| 3001,
  host: process.env.PORT? 'https://server-1612419.herokuapp.com' :'https://localhost:3001',
  secret: 'this_is_a_secret',
  facebookApp: {
    clientID: "353645022016635",
    clientSecret: "96f15d9d932b634acc3bcc67adf4218c"
},

googleApp: {
    clientID: '565230475014-but330a8tqpkkkonm7gpd2e30vc6e96c.apps.googleusercontent.com',
    clientSecret: 'OBf18uG4BslF9nXqklRzCodH'
},
}