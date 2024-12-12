# ScanEat - Cloud Computing

---

# Cloud Infrastructure
<img src="">

---

# API Reference (Still Only Reference)
## Endpoint Routes

| Route                           | HTTP Method | Description                                  |
|---------------------------------|-------------|----------------------------------------------|
| /users                          | GET         | Get all users                                |
| /users/{{idUser}}               | GET         | Get users by Id                              |
| /users                          | POST        | Add user                                     |
| /users/{{idUser}}               | PUT         | Update users                                 |
| /users/{{idUser}}               | DEL         | Delete users                                 |
| /laundry                        | GET         | Get all laundry                              |
| /laundry/{{idLaundry}}          | GET         | Get laundry by Id                            |
| /laundry                        | POST        | Add laundry                                  |
| /laundry/{{idLaundry}}          | PUT         | Update laundry                               |
| /laundry/{{idLaundry}}          | DEL         | Delete laundry                               |
| /transaction                    | GET         | Get all transaction                          |
| /transaction/{{idTransaksi}}    | GET         | Get transaction by Id                        |
| /transaction                    | POST        | Add transaction                              |
| /transaction/{{idTransaksi}}    | PUT         | Update transaction                           |
| /transaction/{{idTransaksi}}    | DEL         | Delete transaction                           |

## Endpoints
All requests to the Users API must include the `x-api-key` header with a valid API key.
