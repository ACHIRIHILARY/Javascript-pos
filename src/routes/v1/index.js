import express from "express";
import authRoutes from "./auth.js";
import productRoutes from "./products.js";
import salesRoutes from "./sales.js";
import reportsRoutes from "./reports.js";
import usersRoutes from "./users.js";
import categoriesRoutes from "./categories.js";
import shiftsRoutes from "./shifts.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/sales", salesRoutes);
router.use("/reports", reportsRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/shifts", shiftsRoutes);

export default router;
