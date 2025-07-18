import { DoctorProfile } from "../entities/doctorProfile";
import createHttpError from "http-errors";
import { User } from "../entities/user";
import { Specialization } from "../entities/specialization";
import { AppDataSource } from "../../ormconfig";

export default class DoctorProfileModules {
  static async createDoctor({
    user,
    specialization,
    license,
  }: {
    user: User;
    specialization: Specialization;
    license: string;
  }) {
    try {
      const newDoctor = new DoctorProfile();
      newDoctor.user = user;
      newDoctor.specialization = specialization;
      newDoctor.medical_license_number = license;
      newDoctor.status = "pending";
      return newDoctor;
    } catch (err) {
      if (err.code === "23505") {
        throw createHttpError.BadRequest("license already exists");
      }
    }
  }

  static async findDoctor(id: string) {
    try {
      const doctorRepo = await AppDataSource.getRepository(DoctorProfile);
      const doctor = await doctorRepo.findOneBy({ id: id });

      if (!doctor) {
        throw createHttpError.NotFound["doctor id is wrong"];
      }
      return doctor;
    } catch (err) {
      throw createHttpError.InternalServerError["internal server erro"];
    }
  }

  static async findDoctorByid(id: string) {
    try {
      const doctorUser = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.doctorProfile", "doctorProfile")
        .where(`user.id = :id`, { id })
        .getOne();

      return doctorUser.doctorProfile;
    } catch (err) {
      if (err.statusCode === 404) throw err;
      throw createHttpError(500, "Internal server error");
    }
  }

  static async fetchPendingDoctors() {
    try {
      const doctors = await AppDataSource.getRepository(DoctorProfile)
        .createQueryBuilder("doctor")
        .leftJoinAndSelect("doctor.user", "user")
        .where("doctor.status = :status", { status: "pending" })
        .getMany();
      return doctors;
    } catch (err) {
      throw createHttpError.InternalServerError["internal server erro"];
    }
  }

  static async approveDoctor(doctors: DoctorProfile[]) {
    try {
      const approvedDoctors = [];
      for (const doctor of doctors) {
        const doctorRepo = await AppDataSource.getRepository(
          DoctorProfile
        ).update(doctor.id, { status: doctor.status, reason: doctor.reason });
      }
      return approvedDoctors;
    } catch (err) {
      throw createHttpError.InternalServerError["internal server erro"];
    }
  }
}
