let mongoose = require('mongoose')

///////////////////
let userSchema = mongoose.Schema(
  {
    // PARA ARCHIVOS PROVENIENTES DE LDAP
    uid: { type: String, lowercase: true },
    givenName: { type: String},
    sn: { type: String},
    displayName: {type: String},
    mail: { type: String, lowercase: true}
  },
  {
    timestamps: true
  }
)
let User = mongoose.model('User', userSchema)

module.exports.User = User