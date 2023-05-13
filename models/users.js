'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Users extends Model {
        static associate(models) {
            // userId @ Users -||--|<- UserId @ Stories
            this.hasMany(models.Stories, {
                sourceKey: 'userId',
                foreignKey: 'UserId',
            });
            // userId @ Users -||--|<- UserId @ Relays
            this.hasMany(models.Relays, {
                sourceKey: 'userId',
                foreignKey: 'UserId',
            });
            // userId @ Users -||--|<- UserId @ Likes
            this.hasMany(models.Likes, {
                sourceKey: 'userId',
                foreignKey: 'UserId',
            });
        }
    }
    Users.init(
        {
            // PK
            userId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            // unique
            nickname: {
                allowNull: false,
                type: DataTypes.STRING,
                unique: true,
            },
            password: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: 'Users',
        }
    );
    return Users;
};
