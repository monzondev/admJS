module.exports = {
    ldap: {
    //DATOS DEL USUARIO ADMINISTRADOR
      //dn: 'dc=example,dc=com',
      dn: 'ou=admins,ou=sistemas,dc=enchiladas,dc=com',
      dn2: 'ou=enchiladas,ou=sistemas,dc=enchiladas,dc=com',

    //URL DEL SERVIDOR LDAP
      //url: 'ldap://ldap.forumsys.com'
      url: 'ldap://192.168.255.30:389' 
    }
}