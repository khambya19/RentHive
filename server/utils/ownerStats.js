const { Op } = require('sequelize');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const Booking = require('../models/Booking');
const BikeBooking = require('../models/BikeBooking');
const Payment = require('../models/Payment');
const BookingApplication = require('../models/BookingApplication');

module.exports = async function getOwnerStats(ownerId) {
  // Compute counts
  const totalProperties = await Property.count({ where: { vendorId: ownerId } });
  const totalBikes = await Bike.count({ where: { vendorId: ownerId } });

  // IDs
  const propertyIds = (await Property.findAll({ where: { vendorId: ownerId }, attributes: ['id'] })).map(p => p.id);
  const bikeIds = (await Bike.findAll({ where: { vendorId: ownerId }, attributes: ['id'] })).map(b => b.id);

  // Rented counts from status
  const rentedPropFromStatus = await Property.findAll({ where: { vendorId: ownerId, status: 'Rented' }, attributes: ['id'] });
  const rentedPropStatusIds = (rentedPropFromStatus || []).map(p => p.id);
  const rentedBikeFromStatus = await Bike.findAll({ where: { vendorId: ownerId, status: 'Rented' }, attributes: ['id'] });
  const rentedBikeStatusIds = (rentedBikeFromStatus || []).map(b => b.id);

  // Active bookings
  const activeBookings = await Booking.findAll({ where: { vendorId: ownerId, status: 'Active' }, attributes: ['propertyId'] });
  const activeBookingPropIds = (activeBookings || []).map(b => b.propertyId);
  const activeBikeBookings = await BikeBooking.findAll({ where: { vendorId: ownerId, status: 'Active' }, attributes: ['bikeId'] });
  const activeBikeIds = (activeBikeBookings || []).map(b => b.bikeId);

  // Approved/paid applications
  const approvedPropApps = await BookingApplication.findAll({ where: { listingId: { [Op.in]: propertyIds }, listingType: 'property', status: { [Op.in]: ['approved', 'paid'] } }, attributes: ['listingId'] });
  const approvedPropAppIds = (approvedPropApps || []).map(a => a.listingId);
  const approvedBikeApps = await BookingApplication.findAll({ where: { listingId: { [Op.in]: bikeIds }, listingType: 'bike', status: { [Op.in]: ['approved', 'paid'] } }, attributes: ['listingId'] });
  const approvedBikeAppIds = (approvedBikeApps || []).map(a => a.listingId);

  // Union to compute rented sets
  const rentedPropSet = new Set([...rentedPropStatusIds, ...activeBookingPropIds, ...approvedPropAppIds]);
  const rentedBikeSet = new Set([...rentedBikeStatusIds, ...activeBikeIds, ...approvedBikeAppIds]);

  const rentedProperties = rentedPropSet.size;
  const rentedBikes = rentedBikeSet.size;

  // Derive available counts from totals minus rented (more robust than relying solely on status)
  const availablePropertiesCount = Math.max(0, totalProperties - rentedProperties);
  const availableBikesCount = Math.max(0, totalBikes - rentedBikes);

  const totalListings = totalProperties + totalBikes;
  const availableListings = availablePropertiesCount + availableBikesCount;

  const oldPropertyBookings = await Booking.count({ where: { vendorId: ownerId } });
  const newPropertyApplications = await BookingApplication.count({ where: { listingId: { [Op.in]: propertyIds }, listingType: 'property' } });
  const totalBookings = oldPropertyBookings + newPropertyApplications;

  const oldBikeRentals = await BikeBooking.count({ where: { vendorId: ownerId } });
  const newBikeApplications = await BookingApplication.count({ where: { listingId: { [Op.in]: bikeIds }, listingType: 'bike' } });
  const bikeRentals = oldBikeRentals + newBikeApplications;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = await Payment.sum('amount', {
    where: {
      ownerId: ownerId,
      status: 'Paid',
      created_at: { [Op.gte]: startOfMonth }
    }
  }) || 0;

  return {
    // Keep top-level fields compatible with existing clients (top-level 'totalProperties' was previously total listings)
    totalProperties: totalListings,
    availableProperties: availableListings,
    totalBookings,
    monthlyRevenue: parseFloat(monthlyRevenue) || 0,
    bikeRentals,
    breakdown: {
      properties: totalProperties,
      bikes: totalBikes,
      availableProperties: availablePropertiesCount,
      availableBikes: availableBikesCount,
      rentedProperties,
      rentedBikes
    }
  };
};