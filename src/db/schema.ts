import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";


//
// ENUMS
//
export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

//
// TABLES
//


export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text("plan"),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const sessionsTable = pgTable("sessions", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' })
});

export const accountsTable = pgTable("accounts", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verificationsTable = pgTable("verifications", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});


export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id").references(() => usersTable.id),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id, { onDelete: "cascade" }),
  avatarImageUrl: text("avatar_image_url"),
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  availableFromWeekDay: integer("avaialable_from_weekday").notNull(),
  availableToWeekDay: integer("available_to_weekday").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id),
  phoneNumber: text("phone_number").notNull(),
  sex: patientSexEnum("sex").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patientsTable.id),
  doctorId: uuid("doctor_id").references(() => doctorsTable.id),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id),
  appointmentDateTime: timestamp("appointment_date_time").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//
// RELATIONS
//
export const usersTableRelations = relations(usersTable, ({ many }) => ({
  clinics: many(usersToClinicsTable),
}));

export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  users: many(usersToClinicsTable),
}));

export const usersToClinicsTableRelations = relations(usersToClinicsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [usersToClinicsTable.userId],
    references: [usersTable.id],
  }),
  clinic: one(clinicsTable, {
    fields: [usersToClinicsTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const doctorsTableRelations = relations(doctorsTable, ({ one, many }) => ({
  clinic: one(clinicsTable, {
    fields: [doctorsTable.clinicId],
    references: [clinicsTable.id],
  }),
  appointments: many(appointmentsTable),
}));

export const patientsTableRelations = relations(patientsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [patientsTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const appointmentsTableRelations = relations(appointmentsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [appointmentsTable.clinicId],
    references: [clinicsTable.id],
  }),
  patient: one(patientsTable, {
    fields: [appointmentsTable.patientId],
    references: [patientsTable.id],
  }),
  doctor: one(doctorsTable, {
    fields: [appointmentsTable.doctorId],
    references: [doctorsTable.id],
  }),
}));
