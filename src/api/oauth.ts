// # Customers API
// sets up all the customers API methods

// import dependencies
import i18n from '../i18n';

/** Customers API Routes
* implements the customers API Routes
*/

// const browse = async function browse(options: any, object: any) : Promise<ICustomer[]> {
//     // fetch all customers from the database
//     let customers: ICustomer[] = await Customer.find({});
//     // check if a response has been returned
//     if(customers == null) throw new InternalServerError();;
//     return customers;
//   }
  
// const read = async function read(options: any, object: any) : Promise<ICustomer> {
//   // fetch a customer based on the id
//   let customer: ICustomer = await Customer.findById(options.id);
//   // check if a response has been returned
//   if(customer == null) throw new BadRequestError({ message: i18n.__('errors.api.customers.notFound') });
//   return customer;
// }
  
// const readByService = async function readByService(options: any, object: any) : Promise<ICustomer> {
//   // find customer based on the access token
//   let customer: ICustomer = await Customer.getUserByService(options.serviceId, options.serviceType);
//   // check if the a response has been returned
//   if(customer == null) throw new BadRequestError({ message: i18n.__('errors.api.customers.notFound') });
//   return customer;
// }
  
// const add = async function add(options: any, object: any) : Promise<ICustomer> {
//   // create new customer in the database
//   const { serviceId, serviceType, serviceDMId } = object;
//   const customer: ICustomer = await Customer.findOrCreate({ serviceId, serviceType, serviceDMId });
//   // check if a response has been returned
//   if(customer == null) throw new BadRequestError({ message: i18n.__('errors.api.customers.notCreated') });
//   return customer;
// }

// const addBalance = async function addBalance(options: any, object: any) : Promise<ICustomer> {
//   // create new customer in the database
//   const { serviceId, serviceType, balanceToAdd } = object;
//   let customer: ICustomer = await Customer.getUserByService(serviceId, serviceType);

//   // check if a response has been returned
//   if(customer == null) throw new BadRequestError({ message: i18n.__('errors.api.customers.notFound') });

//   // add balance to user
//   await customer.atomicCreditIncrement(balanceToAdd);

//   // return customer
//   return customer;
// }


export default {}
