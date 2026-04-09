const sequelize = require('../config/database');
const { Tenant, initTenant } = require('./tenant.model');
const { User, initUser } = require('./user.model');
const { Account, initAccount } = require('./account.model');
const { Customer, initCustomer } = require('./customer.model');
const { Invoice, initInvoice } = require('./invoice.model');
const { PaymentReceivable, initPaymentReceivable } = require('./payment-receivable.model');
const { Journal, initJournal } = require('./journal.model');
const { JournalLine, initJournalLine } = require('./journal-line.model');

initTenant(sequelize);
initUser(sequelize);
initAccount(sequelize);
initCustomer(sequelize);
initInvoice(sequelize);
initPaymentReceivable(sequelize);
initJournal(sequelize);
initJournalLine(sequelize);

Tenant.hasMany(User, {
  foreignKey: 'tenant_id',
  as: 'users'
});

User.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Tenant.hasMany(Account, {
  foreignKey: 'tenant_id',
  as: 'accounts'
});

Account.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Account.belongsTo(Account, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Account.hasMany(Account, {
  foreignKey: 'parent_id',
  as: 'children'
});

Tenant.hasMany(Journal, {
  foreignKey: 'tenant_id',
  as: 'journals'
});

Tenant.hasMany(Customer, {
  foreignKey: 'tenant_id',
  as: 'customers'
});

Customer.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Tenant.hasMany(Invoice, {
  foreignKey: 'tenant_id',
  as: 'invoices'
});

Invoice.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Customer.hasMany(Invoice, {
  foreignKey: 'customer_id',
  as: 'invoices'
});

Invoice.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

Tenant.hasMany(PaymentReceivable, {
  foreignKey: 'tenant_id',
  as: 'payments_receivable'
});

PaymentReceivable.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Invoice.hasMany(PaymentReceivable, {
  foreignKey: 'invoice_id',
  as: 'payments'
});

PaymentReceivable.belongsTo(Invoice, {
  foreignKey: 'invoice_id',
  as: 'invoice'
});

Customer.hasMany(PaymentReceivable, {
  foreignKey: 'customer_id',
  as: 'payments'
});

PaymentReceivable.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

Journal.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Journal.hasMany(JournalLine, {
  foreignKey: 'journal_id',
  as: 'lines'
});

JournalLine.belongsTo(Journal, {
  foreignKey: 'journal_id',
  as: 'journal'
});

Account.hasMany(JournalLine, {
  foreignKey: 'account_id',
  as: 'journal_lines'
});

JournalLine.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

module.exports = {
  sequelize,
  Tenant,
  User,
  Account,
  Customer,
  Invoice,
  PaymentReceivable,
  Journal,
  JournalLine
};
