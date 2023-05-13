'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Likes extends Model {
        static associate(models) {
            // userId @ Users -||--|<- UserId @ Likes
            this.belongsTo(models.Users, {
                targetKey: 'userId',
                foreignKey: 'UserId',
                onDelete: 'CASECADE',
            });
            // sotryId @ Stories -||--|<- StoryId @ Likes
            this.belongsTo(models.Stories, {
                targetKey: 'storyId',
                foreignKey: 'StoryId',
                onDelete: 'CASECADE',
            });
            // relayId @ Relays -||--|<- RelayId @ Likes
            this.belongsTo(models.Relays, {
                targetKey: 'relayId',
                foreignKey: 'RelayId',
                onDelete: 'CASECADE',
            });
        }
    }
    Likes.init(
        {
            likeId: {
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
            // FK from Relays
            RelayId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                references: {
                    model: 'Relays',
                    key: 'relayId',
                },
                onDelete: 'CASCADE',
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
            modelName: 'Likes',
        }
    );
    return Likes;
};
