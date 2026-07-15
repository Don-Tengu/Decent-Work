/**
 * 测试教程：智能合约测试
 *
 * 这个测试文件演示了如何测试 Solidity 智能合约。
 *
 * 关键概念：
 * 1. ethers.js - 与以太坊交互的 JavaScript 库
 * 2. Hardhat - 以太坊开发环境，提供本地测试网络
 * 3. Signer - 代表一个以太坊账户，可以签名交易
 * 4. expect() - Chai 断言库，用于验证结果
 * 5. parseEther() - 将 ETH 转换为 Wei（1 ETH = 10^18 Wei）
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelanceEscrow 智能合约测试", function () {
  // 测试变量
  let escrowContract;
  let owner, client, freelancer, platformWallet;
  let jobId = 1;

  /**
   * 在每个测试前部署新的合约
   * 这样可以确保每个测试都有干净的状态
   */
  beforeEach(async function () {
    // 获取测试账户
    // Hardhat 提供了 20 个测试账户，每个账户有 10000 ETH
    [owner, client, freelancer, platformWallet] = await ethers.getSigners();

    // 部署合约
    const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
    escrowContract = await FreelanceEscrow.deploy(platformWallet.address);
    await escrowContract.waitForDeployment();
  });

  /**
   * 测试套件 1：合约部署
   */
  describe("合约部署", function () {
    it("应该正确设置 owner", async function () {
      expect(await escrowContract.owner()).to.equal(owner.address);
    });

    it("应该正确设置平台钱包地址", async function () {
      expect(await escrowContract.platformWallet()).to.equal(platformWallet.address);
    });

    it("应该设置默认平台费用为 5%", async function () {
      expect(await escrowContract.platformFeePercent()).to.equal(5);
    });

    it("初始 escrowCount 应该为 0", async function () {
      expect(await escrowContract.escrowCount()).to.equal(0);
    });
  });

  /**
   * 测试套件 2：创建托管
   */
  describe("创建托管", function () {
    const escrowAmount = ethers.parseEther("1.0"); // 1 ETH

    it("应该成功创建托管", async function () {
      // 客户创建托管，发送 1 ETH
      const tx = await escrowContract
        .connect(client)
        .createEscrow(jobId, freelancer.address, { value: escrowAmount });

      // 等待交易确认
      await tx.wait();

      // 验证 escrowCount 增加了
      expect(await escrowContract.escrowCount()).to.equal(1);

      // 获取托管信息
      const escrow = await escrowContract.escrows(1);

      // 验证托管信息
      expect(escrow.jobId).to.equal(jobId);
      expect(escrow.client).to.equal(client.address);
      expect(escrow.freelancer).to.equal(freelancer.address);
      expect(escrow.amount).to.equal(escrowAmount);
      expect(escrow.status).to.equal(1); // FUNDED 状态
    });

    it("应该触发 EscrowCreated 和 EscrowFunded 事件", async function () {
      // expect().to.emit() - 验证事件是否被触发
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(jobId, freelancer.address, { value: escrowAmount })
      )
        .to.emit(escrowContract, "EscrowCreated")
        .withArgs(1, jobId, client.address, freelancer.address, escrowAmount)
        .to.emit(escrowContract, "EscrowFunded")
        .withArgs(1, escrowAmount);
    });

    it("金额为 0 时应该失败", async function () {
      // expect().to.be.revertedWith() - 验证交易是否回滚并显示特定错误消息
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(jobId, freelancer.address, { value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("自由职业者地址无效时应该失败", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(jobId, ethers.ZeroAddress, { value: escrowAmount })
      ).to.be.revertedWith("Invalid freelancer address");
    });

    it("客户和自由职业者相同时应该失败", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(jobId, client.address, { value: escrowAmount })
      ).to.be.revertedWith("Client and freelancer cannot be the same");
    });
  });

  /**
   * 测试套件 3：完成托管
   */
  describe("完成托管", function () {
    const escrowAmount = ethers.parseEther("1.0");
    let escrowId;

    beforeEach(async function () {
      // 先创建一个托管
      const tx = await escrowContract
        .connect(client)
        .createEscrow(jobId, freelancer.address, { value: escrowAmount });
      await tx.wait();
      escrowId = 1;
    });

    it("客户应该能够完成托管", async function () {
      // 记录自由职业者和平台钱包的初始余额
      const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platformWallet.address);

      // 完成托管
      const tx = await escrowContract.connect(client).completeEscrow(escrowId);
      await tx.wait();

      // 计算预期的费用和支付金额
      const platformFee = (escrowAmount * 5n) / 100n; // 5% 平台费用
      const freelancerPayment = escrowAmount - platformFee;

      // 验证余额变化
      const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platformWallet.address);

      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(freelancerPayment);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(platformFee);

      // 验证托管状态
      const escrow = await escrowContract.escrows(escrowId);
      expect(escrow.status).to.equal(2); // COMPLETED 状态
    });

    it("应该触发 EscrowCompleted 事件", async function () {
      const platformFee = (escrowAmount * 5n) / 100n;

      await expect(escrowContract.connect(client).completeEscrow(escrowId))
        .to.emit(escrowContract, "EscrowCompleted")
        .withArgs(escrowId, escrowAmount - platformFee, platformFee);
    });

    it("非客户不能完成托管", async function () {
      await expect(
        escrowContract.connect(freelancer).completeEscrow(escrowId)
      ).to.be.revertedWith("Only client can complete");
    });
  });

  /**
   * 测试套件 4：退款
   */
  describe("退款托管", function () {
    const escrowAmount = ethers.parseEther("1.0");
    let escrowId;

    beforeEach(async function () {
      const tx = await escrowContract
        .connect(client)
        .createEscrow(jobId, freelancer.address, { value: escrowAmount });
      await tx.wait();
      escrowId = 1;
    });

    it("客户应该能够申请退款", async function () {
      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrowContract.connect(client).refundEscrow(escrowId);
      const receipt = await tx.wait();

      // 计算 gas 费用
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);

      // 客户余额应该增加（退款金额 - gas 费用）
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(escrowAmount - gasUsed);

      // 验证托管状态
      const escrow = await escrowContract.escrows(escrowId);
      expect(escrow.status).to.equal(3); // REFUNDED 状态
    });

    it("应该触发 EscrowRefunded 事件", async function () {
      await expect(escrowContract.connect(client).refundEscrow(escrowId))
        .to.emit(escrowContract, "EscrowRefunded")
        .withArgs(escrowId, escrowAmount);
    });
  });

  /**
   * 测试套件 5：多个托管
   */
  describe("多个托管", function () {
    it("应该能够创建多个托管", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");

      await escrowContract
        .connect(client)
        .createEscrow(1, freelancer.address, { value: amount1 });

      await escrowContract
        .connect(client)
        .createEscrow(2, freelancer.address, { value: amount2 });

      expect(await escrowContract.escrowCount()).to.equal(2);

      const escrow1 = await escrowContract.escrows(1);
      const escrow2 = await escrowContract.escrows(2);

      expect(escrow1.amount).to.equal(amount1);
      expect(escrow2.amount).to.equal(amount2);
    });
  });
});
