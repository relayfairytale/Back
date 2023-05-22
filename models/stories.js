'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Stories extends Model {
        static associate(models) {
            // userId @ Users -||--|<- UserId @ Stories
            this.belongsTo(models.Users, {
                targetKey: 'userId',
                foreignKey: 'UserId',
                onDelete: 'CASCADE',
            });
            // storyId @ Stories -||--|<- StoryId @ Relays
            this.hasMany(models.Relays, {
                sourceKey: 'storyId',
                foreignKey: 'StoryId',
            });
            // storyId @ Stories -||--|<- StoryId @ Likes
            this.hasMany(models.Likes, {
                sourceKey: 'storyId',
                foreignKey: 'StoryId',
            });
        }
    }
    Stories.init(
        {
            // PK
            storyId: {
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
            title: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            content: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            likeCount: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            isFinished: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            imageURL: {
                allowNull: true,
                type: DataTypes.STRING,
            },
            newWriting: {
                type: DataTypes.STRING,
            },
            writingTime: {
                type: DataTypes.DATE,
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
            modelName: 'Stories',
        }
    );
    return Stories;
};
