<template>
    <div class="container">
        <div class="half"></div>
        <div class="half"></div>
    </div>
</template>

<style>
.container {
    --uib-size: 45px;
    --uib-color: #FFA63F;
    --uib-speed: 0.5s;
    --uib-bg-color: #FFD5A4;
    position: relative;
    display: flex;
    flex-direction: column;
    height: var(--uib-size);
    width: var(--uib-size);
    transform: rotate(45deg);
    animation: rotate calc(var(--uib-speed) * 2) ease-in-out infinite;
}

.half {
    --uib-half-size: calc(var(--uib-size) * 0.435);
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--uib-half-size);
    height: var(--uib-half-size);
    overflow: hidden;
    isolation: isolate;

    &:first-child {
        top: 8.25%;
        left: 8.25%;
        border-radius: 50% 50% calc(var(--uib-size) / 15);
    }

    &:last-child {
        bottom: 8.25%;
        right: 8.25%;
        transform: rotate(180deg);
        align-self: flex-end;
        border-radius: 50% 50% calc(var(--uib-size) / 15);

        &::after {
            animation-delay: calc(var(--uib-speed) * -1);
        }
    }

    &::before {
        content: '';
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background-color: var(--uib-bg-color);
        transition: background-color 0.3s ease;
    }

    &::after {
        content: '';
        position: relative;
        z-index: 1;
        display: block;
        background-color: var(--uib-color);
        height: 100%;
        transform: rotate(45deg) translate(-3%, 50%) scaleX(1.2);
        width: 100%;
        transform-origin: bottom right;
        border-radius: 0 0 calc(var(--uib-size) / 20) 0;
        animation: flow calc(var(--uib-speed) * 2) linear infinite both;
        transition: background-color 0.3s ease;
    }
}

@keyframes flow {
    0% {
        transform: rotate(45deg) translate(-3%, 50%) scaleX(1.2);
    }

    30% {
        transform: rotate(45deg) translate(115%, 50%) scaleX(1.2);
    }

    30.001%,
    50% {
        transform: rotate(0deg) translate(-85%, -85%) scaleX(1);
    }

    80%,
    100% {
        transform: rotate(0deg) translate(0%, 0%) scaleX(1);
    }
}

@keyframes rotate {

    0%,
    30% {
        transform: rotate(45deg);
    }

    50%,
    80% {
        transform: rotate(225deg);
    }

    100% {
        transform: rotate(405deg);
    }
}
</style>
