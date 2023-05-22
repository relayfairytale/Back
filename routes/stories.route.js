const express = require('express');
const { Stories, Users, Relays } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

router.get('/stories', async (req, res) => {
    const stories = await Stories.findAll({
        attributes: ['storyId', 'title', 'content', 'imageURL', 'isFinished', 'likeCount', 'createdAt', 'updatedAt'],
        include: [
            {
                model: Users,
                attributes: ['nickname'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ stories });
});

router.post('/stories', authMiddleware, async (req, res) => {
    const { title, content, imageURL } = req.body;
    const { userId } = res.locals.user;

    const likeCount = 0;
    try {
        await Stories.create({ title, content, imageURL, UserId: userId, likeCount });

        return res.status(201).json({ message: '새로운 동화를 작성하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '새로운 동화 작성에 실패하였습니다.' });
    }
});

router.put('/stories/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { title, content, imageURL } = req.body;
    const { userId } = res.locals.user;

    try {
        const story = await Stories.findOne({ where: { storyId } });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        // admin 계정은 모든 동화를 수정할 수 있음
        // userId가 4인 계정은 admin 계정임
        if (userId !== 4) {
            return res.status(403).json({ errorMessage: '수정 권한이 없습니다.' });
        }

        await Stories.update({ title, content, imageURL }, { where: { storyId } });

        return res.status(200).json({ message: '동화를 수정하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 수정에 실패하였습니다.' });
    }
});

router.delete('/stories/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { userId } = res.locals.user;

    try {
        const story = await Stories.findOne({ where: { storyId } });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        // admin 계정은 모든 동화를 삭제할 수 있음
        // userId가 4인 계정은 admin 계정임
        if (userId !== 4) {
            return res.status(403).json({ errorMessage: '삭제 권한이 없습니다.' });
        }

        await Stories.destroy({ where: { storyId } });

        return res.status(200).json({ message: '동화를 삭제하였습니다.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 삭제에 실패하였습니다.' });
    }
});

router.get('/stories/:storyId', async (req, res) => {
    const { storyId } = req.params;

    try {
        const story = await Stories.findOne({
            where: { storyId },
            attributes: ['storyId', 'title', 'content', 'imageURL', 'isFinished', 'likeCount', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: Users,
                    attributes: ['nickname'],
                },
                {
                    model: Relays,
                    attributes: ['relayId', 'content', 'likeCount'],
                },
            ],
        });
        if (!story) {
            return res.status(404).json({ errorMessage: '존재하지 않는 동화입니다.' });
        }

        return res.status(200).json({ story });
    } catch (err) {
        console.error(err);
        res.status(400).json({ errorMessage: '동화 상세 조회에 실패하였습니다.' });
    }
});

module.exports = router;
