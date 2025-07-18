import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model

# import matplotlib.pyplot as plt
root = os.getcwd()
OUTPUT_DIR = os.path.join(root, "segmented")
# MODEL_PATH = os.path.join(root, "model.h5")

def line_array(x):
    upper, lower = [], []
    for y in range(5, len(x) - 5):
        s_a, s_p = strtline(y, x)
        e_a, e_p = endline(y, x)
        if s_a >= 7 and s_p >= 5:
            upper.append(y)
        if e_a >= 5 and e_p >= 7:
            lower.append(y)
    return upper, lower


def strtline(y, array):
    prev, ahead = 0, 0
    for i in array[y : y + 10]:
        if i > 3:
            ahead += 1
    for i in array[y - 10 : y]:
        if i == 0:
            prev += 1
    return ahead, prev


def endline(y, array):
    ahead = 0
    prev = 0
    for i in array[y : y + 10]:
        if i == 0:
            ahead += 1
    for i in array[y - 10 : y]:
        if i > 3:
            prev += 1
    return ahead, prev


def endline_word(y, array, a):
    ahead = 0
    prev = 0
    for i in array[y : y + 2 * a]:
        if i < 2:
            ahead += 1
    for i in array[y - a : y]:
        if i > 2:
            prev += 1
    return prev, ahead


def end_line_array(array, a):
    list_endlines = []
    for y in range(len(array)):
        e_p, e_a = endline_word(y, array, a)
        # print(e_p, e_a)
        if e_a >= int(1.5 * a) and e_p >= int(0.7 * a):
            list_endlines.append(y)
    return list_endlines


def refine_endword(array):
    refine_list = []
    for y in range(len(array) - 1):
        if array[y] + 1 < array[y + 1]:
            refine_list.append(array[y])

    if len(array) != 0:
        refine_list.append(array[-1])
    return refine_list


def refine_array(array_upper, array_lower):
    upper, lower = [], []
    for y in range(len(array_upper) - 1):
        if array_upper[y] + 5 < array_upper[y + 1]:
            upper.append(array_upper[y] - 10)
    for y in range(len(array_lower) - 1):
        if array_lower[y] + 5 < array_lower[y + 1]:
            lower.append(array_lower[y] + 10)
    if array_upper:
        upper.append(array_upper[-1] - 10)
    if array_lower:
        lower.append(array_lower[-1] + 10)
    return upper, lower


def letter_width(contours):
    letter_width_sum = 0
    count = 0
    for cnt in contours:
        if cv2.contourArea(cnt) > 20:
            x, y, w, h = cv2.boundingRect(cnt)
            letter_width_sum += w
            count += 1
    if count == 0:
        return 0
    return letter_width_sum / count


def end_wrd_dtct(lines, i, bin_img, mean_lttr_width, total_width):
    count_y = np.zeros(shape=total_width)
    for x in range(total_width):
        for y in range(lines[i][0], lines[i][1]):
            if bin_img[y][x] == 255:
                count_y[x] += 1

    end_lines = end_line_array(count_y, int(mean_lttr_width))
    endlines = refine_endword(end_lines)
    return endlines


def get_letter_rect(k, contours):
    valid = True
    x, y, w, h = cv2.boundingRect(contours[k])
    for i in range(len(contours)):
        cnt = contours[i]
        if i == k:
            continue
        elif cv2.contourArea(cnt) < 50:
            continue

        x1, y1, w1, h1 = cv2.boundingRect(cnt)

        if abs(x1 + w1 / 2 - (x + w / 2)) < 50:
            if y1 > y:
                h = abs(y - (y1 + h1))
                w = abs(x - (x1 + w1))
            else:
                valid = False
            break

    return (valid, x, y, w, h)


def letter_seg(lines_img, x_lines, i):
    copy_img = lines_img[i].copy()
    x_linescopy = x_lines[i].copy()

    letter_img = []
    letter_k = []

    contours, hierarchy = cv2.findContours(
        copy_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    for k in range(len(contours)):
        cnt = contours[k]
        if cv2.contourArea(cnt) < 50:
            continue

        valid, x, y, w, h = get_letter_rect(k, contours)
        if valid:
            letter_k.append((x, y, w, h))

    letter = sorted(letter_k, key=lambda student: student[0])

    word = 1
    letter_index = 0
    for e in range(len(letter)):
        if letter[e][0] < x_linescopy[0]:
            letter_index += 1
            letter_img_tmp = lines_img[i][
                letter[e][1] - 5 : letter[e][1] + letter[e][3] + 5,
                letter[e][0] - 5 : letter[e][0] + letter[e][2] + 5,
            ]
            letter_img = letter_img_tmp  # cv2.resize(letter_img_tmp, dsize =(28, 28), interpolation = cv2.INTER_AREA)
            cv2.imwrite(
                os.path.join(
                    OUTPUT_DIR,
                    str(i + 1) + "_" + str(word) + "_" + str(letter_index) + ".jpg",
                ),
                255 - letter_img,
            )
        else:
            x_linescopy.pop(0)
            word += 1
            letter_index = 1
            letter_img_tmp = lines_img[i][
                letter[e][1] - 5 : letter[e][1] + letter[e][3] + 5,
                letter[e][0] - 5 : letter[e][0] + letter[e][2] + 5,
            ]
            letter_img = cv2.resize(
                letter_img_tmp, dsize=(28, 28), interpolation=cv2.INTER_AREA
            )
            cv2.imwrite(
                OUTPUT_DIR
                + str(i + 1)
                + "_"
                + str(word)
                + "_"
                + str(letter_index)
                + ".jpg",
                255 - letter_img,
            )


def image_segmentation(filepath):
    print("\n........Program Initiated.......\n")
    src_img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
    # src_img = cv2.imread(filepath, -1)[:, :, 3]
    if len(set(src_img.flatten())) == 1:
        src_img = cv2.imread(filepath, -1)[:, :, 0]
    orig_height, orig_width = src_img.shape

    print("\n Resizing Image........")
    width = 1320
    height = int(width * orig_height / orig_width)
    src_img = cv2.resize(src_img, dsize=(width, height), interpolation=cv2.INTER_AREA)

    print("#---------Image Info:--------#")
    print("\tHeight =", height, "\n\tWidth =", width)
    PIXEL_SET = 255
    kernel_size = 21
    normalized_mean = 20
    bin_img = cv2.adaptiveThreshold(
        src_img,
        PIXEL_SET,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        kernel_size,
        normalized_mean,
    )

    print("Noise Removal")
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    final_thr = cv2.morphologyEx(bin_img, cv2.MORPH_CLOSE, kernel)
    contr_retrival = final_thr.copy()
    print("Character Segmentation")
    count_x = np.zeros(shape=(height))
    for y in range(height):
        for x in range(width):
            if bin_img[y][x] == PIXEL_SET:
                count_x[y] += 1

    upper_lines, lower_lines = line_array(count_x)
    upperlines, lowerlines = refine_array(upper_lines, lower_lines)

    if len(upperlines) == len(lowerlines):
        lines = []
        for y in upperlines:
            final_thr[y][:] = PIXEL_SET
        for y in lowerlines:
            final_thr[y][:] = PIXEL_SET
        for y in range(len(upperlines)):
            lines.append((upperlines[y], lowerlines[y]))
    else:
        print("Unable to process the noisy image")
        k = cv2.waitKey(0)
        while 1:
            k = cv2.waitKey(0)
            if k & 0xFF == ord("q"):
                cv2.destroyAllWindows()
                exit()

    lines = np.array(lines)
    no_of_lines = len(lines)
    print("\nLines :", no_of_lines)

    lines_img = []
    for i in range(no_of_lines):
        lines_img.append(bin_img[lines[i][0] : lines[i][1], :])

    contours, hierarchy = cv2.findContours(
        contr_retrival, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    cv2.drawContours(src_img, contours, -1, (0, 255, 0), 1)

    mean_lttr_width = letter_width(contours)
    print("\nAverage Width of Each Letter:- ", mean_lttr_width)
    x_lines = []

    for i in range(len(lines_img)):
        x_lines.append(end_wrd_dtct(lines, i, bin_img, mean_lttr_width, width))

    for i in range(len(x_lines)):
        x_lines[i].append(width)
    for i in range(len(lines)):
        letter_seg(lines_img, x_lines, i)
    contours, hierarchy = cv2.findContours(
        bin_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    for cnt in contours:
        if cv2.contourArea(cnt) > 20:
            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(src_img, (x, y), (x + w, y + h), (0, 255, 0), 2)
