require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const cors = require("cors");
const { body, validationResult } = require("express-validator");

const app = express();

// Validate environment variables
const requiredEnvVars = [
  "DB_USER",
  "DB_PASSWORD",
  "DB_SERVER",
  "DB_PORT",
  "DB_DATABASE",
  "JWT_SECRET",
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Keep encryption enabled
    trustServerCertificate: true, // This bypasses self-signed cert validation
    enableArithAbort: true,
    // Add these to suppress the TLS warning:
    validateBulkLoadParameters: false,
    abortTransactionOnError: false,
  },
};

// Test database connection on startup
async function testConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("Connected to MSSQL database");
    const result = await pool.request().query("SELECT 1 as test");
    console.log("Database test successful:", result.recordset);
    await pool.close();
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

testConnection();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-very-secure-secret";

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).send({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: "Invalid token" });
  }
};

// Login endpoint
app.post(
  "/api/login",
  [body("username").trim().notEmpty(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("username", sql.NVarChar, req.body.username)
        .query("SELECT * FROM ERP_Users WHERE UserName = @username");

      if (result.recordset.length === 0) {
        return res.status(401).send({ error: "Invalid credentials" });
      }

      const user = result.recordset[0];

      // Direct plain text comparison (since passwords aren't hashed)
      if (user.Password !== req.body.password) {
        return res.status(401).send({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.UserName }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).send({
        error: "Server error",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
);

// Search items endpoint
app.get("/api/items", authenticate, async (req, res) => {
  const { search } = req.query;

  try {
    const pool = await sql.connect(dbConfig);
    let result;

    if (search) {
      result = await pool.request().input("search", sql.NVarChar, `%${search}%`)
        .query(`
        SELECT ItemMaster.itemcode, ItemMaster.productname, ItemMaster.description, ItemMaster.picture, ItemMaster.active, ItemMaster.saleprice, ItemMaster.oldcode, Category2.id AS FKSubGroupID, Category2.description as desc_subgroup FROM Category3 INNER JOIN ItemMaster ON Category3.ID = ItemMaster.FKSubGroupID INNER JOIN Category2 ON Category3.FK_Category2ID = Category2.ID
        WHERE (itemcode LIKE @search OR productname LIKE @search OR oldcode LIKE @search) And FKItemType=5
        `);
    } else {
      result = await pool
        .request()
        .query(
          "SELECT ItemMaster.itemcode, ItemMaster.productname, ItemMaster.description, ItemMaster.picture, ItemMaster.active, ItemMaster.saleprice, ItemMaster.oldcode, Category2.id AS FKSubGroupID, Category2.description as desc_subgroup FROM Category3 INNER JOIN ItemMaster ON Category3.ID = ItemMaster.FKSubGroupID INNER JOIN Category2 ON Category3.FK_Category2ID = Category2.ID where FKItemType=5"
        );
    }

    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error" });
  }
});

app.get("/api/stock/:itemCode", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("itemCode", sql.NVarChar, req.params.itemCode).query(`
      SELECT 
      Category,
      OldCode,
      ItemCode,
      ProductName,
      Material,
      Color,
      Finish,
      SUM(Stock) AS Stock
  FROM (
      SELECT 
          C2.Description AS Category,     
          VD.OldCode, 
          (IM.ItemCode + '-' + M.M_Code + '-' + C.Code + '-' + F.Code) AS ItemCode, 
          IM.ProductName, 
          M.ProductName AS Material, 
          C.Color, 
          F.Finish, 
          SUM(VD.T_Stock) AS Stock
      FROM 
          ItemMaster IM 
          INNER JOIN Category3 C3 ON IM.FKSubGroupID = C3.ID
          INNER JOIN Category2 C2 ON C3.FK_Category2ID = C2.ID
          INNER JOIN FinishProductVariantDetail VD ON VD.FK_ItemMasterID = IM.ID
          INNER JOIN FP_MaterialMaster M ON VD.FKMaterialID = M.ID
          INNER JOIN FP_ColorMaster C ON VD.FKColourID = C.ID
          INNER JOIN Finish F ON VD.FKFinishID = F.ID
      GROUP BY 
          C2.Description, VD.OldCode, 
          (IM.ItemCode + '-' + M.M_Code + '-' + C.Code + '-' + F.Code), 
          IM.ProductName, 
          M.ProductName, 
          C.Color, F.Finish
  
      UNION ALL
     
      SELECT 
          C2.Description AS Category,     
          VD.OldCode, 
          (IM.ItemCode + '-' + M.M_Code + '-' + C.Code + '-' + F.Code) AS ItemCode, 
          IM.ProductName, 
          M.ProductName AS Material, 
          C.Color, 
          F.Finish, 
          SUM(SD.Stock) AS Stock
      FROM 
          ItemMaster IM 
          INNER JOIN Category3 C3 ON IM.FKSubGroupID = C3.ID
          INNER JOIN Category2 C2 ON C3.FK_Category2ID = C2.ID
          INNER JOIN FinishProductVariantDetail VD ON VD.FK_ItemMasterID = IM.ID
          INNER JOIN FP_MaterialMaster M ON VD.FKMaterialID = M.ID
          INNER JOIN FP_ColorMaster C ON VD.FKColourID = C.ID
          INNER JOIN Finish F ON VD.FKFinishID = F.ID
          INNER JOIN StoreDetail SD ON SD.FK_Variant = VD.ID
          INNER JOIN Store S ON SD.FK_Store = S.ID AND S.Active = 1
      GROUP BY 
          C2.Description, VD.OldCode, 
          (IM.ItemCode + '-' + M.M_Code + '-' + C.Code + '-' + F.Code), 
          IM.ProductName, 
          M.ProductName, 
          C.Color, F.Finish
  ) AS Combined
  where left(itemcode,6)=@itemCode and Stock>0
  GROUP BY 
      Category, OldCode, ItemCode, ProductName, Material, Color, Finish
  ORDER BY 
      ItemCode`);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/store-stock/:itemCode", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("itemCode", sql.NVarChar, req.params.itemCode).query(`
      -- First part of UNION (HeadOffice data)
SELECT 
    C2.Description as Category, 
    '000' BrCode, 
    (CASE WHEN VD.Active=0 AND VD.Status!= '' THEN 'HeadOffice'+'-'+VD.Status ELSE 'HeadOffice' END) Store,    
    VD.OldCode, 
    (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) as ItemCode, 
    IM.ProductName, 
    M.ProductName as Material, 
    C.Color, 
    F.Finish, 
    VD.T_Stock as Stock   
FROM 
    ItemMaster IM 
    INNER JOIN (Category3 C3 INNER JOIN Category2 C2 ON C3.FK_Category2ID=C2.ID) ON IM.FKSubGroupID=C3.ID
    INNER JOIN (
        FinishProductVariantDetail VD 
        INNER JOIN FP_MaterialMaster M ON VD.FKMaterialID=M.ID
        INNER JOIN FP_ColorMaster C ON VD.FKColourID=C.ID
        INNER JOIN Finish F ON VD.FKFinishID=F.ID
    ) ON VD.FK_ItemMasterID=IM.ID
WHERE 
    (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) = @itemCode and  VD.T_Stock>0

UNION

-- Second part of UNION (Store data)
SELECT 
    C2.Description as Category, 
    S.StoreCode BrCode, 
    (CASE WHEN SD.Active=0 THEN S.StoreName+'-'+SD.Status ELSE S.StoreName END) as Store, 
    VD.OldCode, 
    (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) as ItemCode, 
    IM.ProductName, 
    M.ProductName as Material, 
    C.Color, 
    F.Finish, 
    SD.Stock
FROM 
    ItemMaster IM 
    INNER JOIN (Category3 C3 INNER JOIN Category2 C2 ON C3.FK_Category2ID=C2.ID) ON IM.FKSubGroupID=C3.ID
    INNER JOIN (
        FinishProductVariantDetail VD 
        INNER JOIN FP_MaterialMaster M ON VD.FKMaterialID=M.ID
        INNER JOIN FP_ColorMaster C ON VD.FKColourID=C.ID
        INNER JOIN Finish F ON VD.FKFinishID=F.ID
    ) ON VD.FK_ItemMasterID=IM.ID
    INNER JOIN (
        StoreDetail SD 
        INNER JOIN Store S ON SD.FK_Store=S.ID AND S.Active=1
    ) ON SD.FK_Variant=VD.ID
WHERE 
    (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) = @itemCode and  SD.Stock>0

ORDER BY ItemCode;
      
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
