const EthCrypto = require('eth-crypto');

export const get_secret = async function (b_pub_key,secret_item_string) {
    const encrypted_message = await EthCrypto.encryptWithPublicKey(
        b_pub_key, // publicKey
        secret_item_string // message
    );
    //convert the cypher text to string off chain
    let secret_cipher_string = await EthCrypto.cipher.stringify(encrypted_message);
    return secret_cipher_string;
}