import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class RdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new cdk.aws_ec2.Vpc(this, "VPC", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr("10.0.1.0/24"),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 26,
        },
        {
          name: "Isolated",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 26,
        },
      ],
    });

    // RDS Subnet Group
    const subnetGroup = new cdk.aws_rds.SubnetGroup(this, "RDS Subnet Group", {
      vpc,
      description: "RDS Subnet Group",
      subnetGroupName: "rds-subgrp",
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS DB Instance
    const dbInstance = new cdk.aws_rds.DatabaseInstance(
      this,
      "RDS DB Instance",
      {
        engine: cdk.aws_rds.DatabaseInstanceEngine.postgres({
          version: cdk.aws_rds.PostgresEngineVersion.VER_14_4,
        }),
        vpc,
        allocatedStorage: 400,
        availabilityZone: vpc.availabilityZones[0],
        backupRetention: cdk.Duration.days(0),
        instanceIdentifier: "rds-db-instance",
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T3,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
        multiAz: false,
        port: 5432,
        publiclyAccessible: false,
        storageEncrypted: true,
        storageType: cdk.aws_rds.StorageType.GP2,
        subnetGroup,
      }
    );

    // Set DB Instance storage type to gp3
    const cfnDbInstance = dbInstance.node
      .defaultChild as cdk.aws_rds.CfnDBInstance;

    cfnDbInstance.addPropertyOverride("StorageType", "gp3");

    // Storage Throughput
    cfnDbInstance.addPropertyOverride("StorageThroughput", "600");

    // IOPS
    cfnDbInstance.addPropertyOverride("Iops", "15000");
  }
}
