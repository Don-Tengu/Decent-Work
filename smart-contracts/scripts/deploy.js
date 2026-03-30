const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy FreelanceEscrow
  const platformWallet = deployer.address; // Use deployer as platform wallet for now
  const FreelanceEscrow = await hre.ethers.getContractFactory("FreelanceEscrow");
  const escrow = await FreelanceEscrow.deploy(platformWallet);

  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();

  console.log("FreelanceEscrow deployed to:", escrowAddress);
  console.log("Platform wallet:", platformWallet);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    escrowAddress: escrowAddress,
    platformWallet: platformWallet,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    './deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
