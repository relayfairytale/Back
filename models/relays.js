'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Relays extends Model {
        static associate(models) {
            // storyId @ Stories -||--|<- StoryId @ Relays
            this.belongsTo(models.Stories, {
                targetKey: 'storyId',
                foreignKey: 'StoryId',
                onDelete: 'CASCADE',
            });
            // uersId @ Users -||--|<- UserId @ Relays
            this.belongsTo(models.Users, {
                targetKey: 'userId',
                foreignKey: 'UserId',
                onDelete: 'CASCADE',
            });
        }
    }
    Relays.init(
        {
            // PK
            relayId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            // FK from Users
            UserId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                references: {
                    model: 'Users',
                    key: 'userId',
                },
                onDelete: 'CASCADE',
            },
            // FK from Stories
            StoryId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                references: {
                    model: 'Stories',
                    key: 'storyId',
                },
                onDelete: 'CASCADE',
            },
            content: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            likeCount: {
                allowNull: false,
                type: DataTypes.INTEGER,
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
            modelName: 'Relays',
        }
    );
    return Relays;
};
